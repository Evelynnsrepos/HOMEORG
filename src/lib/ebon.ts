import { toLines, type TextRun } from './pdf';
import type { Amount, OrderLine, ReweOrder } from './rewe';

/**
 * Reads the eBon REWE sends for a shop at the till: the receipt printed into a
 * PDF, one fixed-width line per text run. It comes back in the same shape as
 * an order, so the rest of the import doesn't care which one you picked.
 *
 *   MANDARINE                        3,40 B
 *            0,758 kg x   4,49 EUR/kg
 *   KAKI                             1,98 B
 *                2 Stk x    0,99
 *   ...
 *    SUMME                   EUR     74,60
 *   Datum:                        20.10.2026
 *   Uhrzeit:                    16:56:20 Uhr
 *   Beleg-Nr.                           6659
 */

export class NotAnEbon extends Error {
  constructor() {
    super("This doesn't look like a REWE eBon.");
  }
}

/** A name, a price, a tax letter: "LIMETTE   1,49 B". */
const ITEM = /^(.+?)\s{2,}(-?\d+,\d{2})\s*([A-Z])?\s*\*?$/;
const COUNT = /^(\d+)\s*Stk\s*x\s*-?\d+,\d{2}/i;
const WEIGHT = /^(\d+,\d+)\s*kg\s*x\s*-?\d+,\d{2}/i;
const FEE = /^(pfand|leergut|rabatt|coupon|bonus|payback|gutschein)\b/i;

const cents = (s: string) => Math.round(parseFloat(s.replace(',', '.')) * 100);

export function parseEbon(runs: TextRun[]): ReweOrder {
  const lines = toLines(runs).map((l) => l.map((r) => r.text).join(' ').replace(/\s+$/, ''));
  const text = lines.join('\n');
  if (!/REWE/i.test(text) || !/^\s*SUMME\b/im.test(text)) throw new NotAnEbon();

  const order: ReweOrder = { lines: [] };
  let open: OrderLine | null = null;
  let items = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!items) {
      // the column head "EUR" sits right above the first article
      if (/^EUR$/.test(line)) items = true;
      continue;
    }
    if (/^-{5,}|^SUMME\b/i.test(line)) break;

    const count = COUNT.exec(line);
    const weight = WEIGHT.exec(line);
    if ((count || weight) && open) {
      const amount: Amount = count
        ? { n: Number(count[1]), unit: 'pc' }
        : { n: Math.round(parseFloat(weight![1].replace(',', '.')) * 1000), unit: 'g' };
      open.ordered = open.delivered = amount;
      continue;
    }

    const item = ITEM.exec(line);
    if (!item) continue;
    const total = cents(item[2]);
    const name = item[1].trim();
    open = {
      name,
      section: total < 0 || FEE.test(name) ? 'fees' : 'delivered',
      ordered: { n: 1, unit: 'pc' },
      delivered: { n: 1, unit: 'pc' },
      total,
    };
    order.lines.push(open);
  }

  const date = /Datum:?\s+(\d{2})\.(\d{2})\.(\d{4})/.exec(text);
  const time = /Uhrzeit:?\s+(\d{2}):(\d{2})/.exec(text);
  const bon = /(?:Beleg|Bon)-Nr\.?:?\s+(\d+)/.exec(text);
  if (date) order.date = `${date[3]}-${date[2]}-${date[1]}`;
  // no order number on a receipt: the till's slip number on that day and minute is as unique
  if (date && bon) {
    order.orderNo = `eBon ${order.date}${time ? ` ${time[1]}:${time[2]}` : ''} #${bon[1]}`;
  }

  if (!order.lines.some((l) => l.section === 'delivered')) throw new NotAnEbon();
  return order;
}
