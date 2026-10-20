import { toLines, type TextRun } from './pdf';

/**
 * Reads the order PDF REWE sends for the Abhol- and Lieferservice (the
 * "Abholavis" / "Lieferavis") and gives back what actually came home.
 *
 * The article table has five columns — Artikelbezeichnung, Bestellmenge,
 * Liefermenge, Einzelpreis, Betrag — and is cut into sections: Lieferbar,
 * Abweichende Menge, Ersatzartikel, Nicht lieferbar, Gebühren und Pfand. The
 * header repeats on every page, a little shifted, so the columns are measured
 * again per page. Long names wrap onto a second line with nothing in the
 * number columns; loose produce has an extra "Herkunftsland" line under it.
 */

export type Section = 'delivered' | 'changed' | 'substitute' | 'missing' | 'fees';

export interface Amount {
  n: number;
  /** 'pc' for counted things, 'g' for loose produce sold by weight */
  unit: 'pc' | 'g';
}

export interface OrderLine {
  /** the name exactly as printed, wrapped lines joined */
  name: string;
  section: Section;
  ordered: Amount | null;
  delivered: Amount | null;
  /** line total in cents */
  total: number | null;
}

export interface ReweOrder {
  orderNo?: string;
  /** day key of the pickup or delivery */
  date?: string;
  lines: OrderLine[];
}

export class NotAReweOrder extends Error {
  constructor() {
    super("This doesn't look like a REWE order.");
  }
}

const SECTIONS: [RegExp, Section][] = [
  [/^lieferbar$/i, 'delivered'],
  [/^abweichende menge$/i, 'changed'],
  [/^ersatzartikel$/i, 'substitute'],
  [/^nicht lieferbar$/i, 'missing'],
  [/^geb(ü|ue)hren/i, 'fees'],
  [/^pfand/i, 'fees'],
];

function amount(text: string): Amount | null {
  const m = text.replace(/\s+/g, ' ').trim().match(/^(\d+(?:,\d+)?)\s*(g|kg|stk|stück)?$/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  const unit = m[2]?.toLowerCase();
  if (unit === 'kg') return { n: Math.round(n * 1000), unit: 'g' };
  if (unit === 'g') return { n, unit: 'g' };
  return { n, unit: 'pc' };
}

function cents(text: string): number | null {
  const m = text.match(/-?\d+(?:\.\d{3})*,\d{2}/);
  return m ? Math.round(parseFloat(m[0].replace(/\./g, '').replace(',', '.')) * 100) : null;
}

function dayFrom(text: string): string | undefined {
  const m = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

export function parseReweOrder(runs: TextRun[]): ReweOrder {
  const lines = toLines(runs);
  const order: ReweOrder = { lines: [] };

  /** left edges of the number columns on the current page */
  let cols: { ordered: number; delivered: number; price: number; total: number } | null = null;
  let page = -1;
  let section: Section = 'delivered';
  let open: OrderLine | null = null;
  let done = false;
  let sawHeader = false;

  for (const line of lines) {
    const text = clean(line.map((r) => r.text).join(' '));

    if (line[0].page !== page) {
      page = line[0].page;
      cols = null;
    }

    // header fields, above the table on the first page
    if (!order.orderNo) {
      const at = line.findIndex((r) => /^Bestellnummer:?$/i.test(r.text.trim()));
      if (at >= 0 && line[at + 1]) order.orderNo = clean(line[at + 1].text);
    }
    if (!order.date) {
      const at = line.findIndex((r) => /^(Abholdatum|Lieferdatum|Liefertermin):?$/i.test(r.text.trim()));
      if (at >= 0 && line[at + 1]) order.date = dayFrom(line[at + 1].text);
    }

    const head = (word: RegExp) => line.find((r) => word.test(r.text.trim()))?.x;
    if (/Artikelbezeichnung/i.test(text) && /Liefermenge/i.test(text)) {
      const ordered = head(/^Bestellmenge$/i);
      const delivered = head(/^Liefermenge$/i);
      const price = head(/^Einzelpreis$/i);
      const total = head(/^Betrag$/i);
      if (ordered != null && delivered != null && price != null && total != null) {
        cols = { ordered, delivered, price, total };
        sawHeader = true;
      }
      open = null;
      continue;
    }

    if (!cols || done) continue;
    if (/^Gesamtpreis/i.test(text) || line.some((r) => /^Gesamtpreis/i.test(r.text.trim()))) {
      done = true;
      continue;
    }

    const c = cols;
    const name = line.filter((r) => r.x < c.ordered - 4);
    const cell = (from: number, to: number) =>
      clean(
        line
          .filter((r) => r.x >= from - 4 && r.x < to - 4)
          .map((r) => r.text)
          .join(' '),
      );
    const ordered = cell(c.ordered, c.delivered);
    const delivered = cell(c.delivered, c.price);
    const price = cell(c.price, c.total);
    const total = cell(c.total, Infinity);
    const nameText = clean(name.map((r) => r.text).join(' '));

    if (!ordered && !delivered && !price && !total) {
      if (!nameText) continue;
      const label = SECTIONS.find(([re]) => re.test(nameText));
      if (label) {
        section = label[1];
        open = null;
      } else if (/^Herkunftsland\b|^Klasse\b|^Ursprung/i.test(nameText)) {
        // origin and class of loose produce: nice to know, not a product
      } else if (open) {
        open.name = clean(`${open.name} ${nameText}`);
      }
      continue;
    }

    if (!nameText) continue;
    open = {
      name: nameText,
      section,
      ordered: amount(ordered),
      delivered: amount(delivered),
      total: total ? cents(total) : null,
    };
    order.lines.push(open);
  }

  if (!sawHeader || !order.lines.length) throw new NotAReweOrder();
  return order;
}

/** What came home: delivered lines with something in the Liefermenge column. */
export function deliveredLines(order: ReweOrder): OrderLine[] {
  return order.lines.filter(
    (l) => l.section !== 'missing' && l.section !== 'fees' && (l.delivered?.n ?? 0) > 0,
  );
}
