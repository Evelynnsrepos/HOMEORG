import { guessFor, type Place } from '../data/units';
import { readPdfText } from './pdf';
import { deliveredLines, parseReweOrder, type OrderLine, type ReweOrder } from './rewe';

/**
 * From a parsed shop order to rows you can put on a shelf: tidy names, an
 * amount and unit that read like the rest of the pantry, and a first guess at
 * where each thing goes. Nothing is stored here — the review screen does that
 * once you've had a look.
 */

export interface ImportDraft {
  /** what the shelf memory is keyed on */
  key: string;
  name: string;
  qty: number;
  unit: string;
  place: Place;
  /** tealights and roses come in the same bag as the yoghurt */
  food: boolean;
  /** ticked to be put away */
  keep: boolean;
  /** the line as REWE printed it */
  source: string;
  changed?: 'amount' | 'substitute';
  /** set by hand in the review, day key */
  bestBefore?: string;
}

export interface Skipped {
  name: string;
  why: 'missing' | 'replaced' | 'fee';
}

export interface ImportPlan {
  orderNo?: string;
  date?: string;
  drafts: ImportDraft[];
  skipped: Skipped[];
}

/** REWE's own lines are part of the name, but not a part anyone says out loud. */
const HOUSE_BRANDS: [RegExp, string][] = [
  [/^REWE Beste Wahl\s+/i, ''],
  [/^REWE Regional\s+/i, ''],
  [/^REWE frei von\s+/i, ''],
  [/^REWE Bio\s+/i, 'Bio '],
  [/^ja!\s+/i, ''],
];

/** Shorthand on the loose produce labels. */
const CAPS_WORDS: Record<string, string> = {
  'KART.': 'KARTOFFELN',
};

/**
 * "PETERSILIE KRAUS GQB" is a till label, not a name: drop the supplier and
 * grade codes and write it like a person would.
 */
function untill(name: string): string {
  if (/[a-zäöüß]/.test(name)) return name;
  const words = name
    .split(/\s+/)
    .map((w) => CAPS_WORDS[w] ?? w)
    .filter((w, i) => i === 0 || !(/^\d+ER$/.test(w) || /^[A-ZÄÖÜ]{2,3}$/.test(w)));
  const lower = words.join(' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function tidyName(raw: string, weighed = false): string {
  let name = raw.replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
  for (const [re, to] of HOUSE_BRANDS) name = name.replace(re, to);
  // "Zwiebel rot ca. 100g" is the price per 100 g, not what's in the bag
  if (weighed) name = name.replace(/\s*ca\.\s*\d+(?:,\d+)?\s*(g|kg)\b/i, '');
  return untill(name).trim();
}

const NOT_FOOD =
  /teelicht|kerze|tabak|iqos|terea|zigarett|\brosen\b|blumen|\bstiele\b|strau(ß|ss)|servietten|spülmittel|spültabs|toilettenpapier|klopapier|küchenrolle|taschentücher|müllbeutel|waschmittel|weichspüler|batterie|zahnpasta|zahnbürste|shampoo|duschgel|\bdeo\b|seife|reiniger|schwamm|alufolie|frischhaltefolie|backpapier|gefrierbeutel|katzen|hunde|tiernahrung|streu\b/i;

export function isFood(name: string): boolean {
  return !NOT_FOOD.test(name);
}

const keyOf = (name: string) => name.trim().toLowerCase();

function amountFor(line: OrderLine, name: string): { qty: number; unit: string } {
  const got = line.delivered!;
  if (got.unit === 'g') {
    return got.n >= 1000 ? { qty: Math.round(got.n / 10) / 100, unit: 'kg' } : { qty: got.n, unit: 'g' };
  }

  // eggs are counted one by one, not by the box
  const eggs = /\beier\b/i.test(name) && name.match(/(\d+)\s*(stück|stk)/i);
  if (eggs) return { qty: got.n * parseInt(eggs[1], 10), unit: 'pc' };

  if (/im netz|\bnetz\b|beutel/i.test(name)) return { qty: got.n, unit: 'bag' };
  const guess = guessFor(name);
  // a packet with a size on it is a packet, even if we can't tell what's in it
  if (!guess.known && /\d\s*(g|kg|ml|l)\b/i.test(name)) return { qty: got.n, unit: 'pack' };
  return { qty: got.n, unit: guess.unit };
}

export function planImport(order: ReweOrder, memory: Record<string, Place> = {}): ImportPlan {
  const skipped: Skipped[] = [];
  for (const l of order.lines) {
    const gone = (l.delivered?.n ?? 0) <= 0;
    if (l.section === 'fees') skipped.push({ name: l.name, why: 'fee' });
    else if (gone) skipped.push({ name: tidyName(l.name), why: l.section === 'substitute' ? 'replaced' : 'missing' });
  }

  const byKey = new Map<string, ImportDraft>();
  for (const line of deliveredLines(order)) {
    const name = tidyName(line.name, line.delivered?.unit === 'g');
    if (!name) continue;
    const key = keyOf(name);
    const { qty, unit } = amountFor(line, name);

    const same = byKey.get(key);
    if (same && same.unit === unit) {
      same.qty = Math.round((same.qty + qty) * 100) / 100;
      continue;
    }

    const food = isFood(name);
    byKey.set(key, {
      key,
      name,
      qty,
      unit,
      place: memory[key] ?? guessFor(name).place,
      food,
      keep: food,
      source: line.name,
      changed: line.section === 'changed' ? 'amount' : line.section === 'substitute' ? 'substitute' : undefined,
    });
  }

  return { orderNo: order.orderNo, date: order.date, drafts: [...byKey.values()], skipped };
}

/** The whole trip from file bytes to rows. Throws NotAReweOrder for anything else. */
export function readReweOrder(bytes: Uint8Array, memory?: Record<string, Place>): ImportPlan {
  return planImport(parseReweOrder(readPdfText(bytes)), memory);
}

/**
 * Is the thing on the shopping list the thing that came home? Word by word,
 * allowing German compounds and plurals: "Zwiebeln" matches
 * "Gemüsezwiebeln 750g", but "Eier" doesn't match "Eiernudeln".
 */
export function sameThing(listed: string, bought: string): boolean {
  const words = (s: string) =>
    s
      .toLowerCase()
      .split(/[^a-zäöüß]+/)
      .filter((w) => w.length >= 3);
  const want = words(listed);
  const have = words(bought);
  if (!want.length) return false;
  return want.every((w) =>
    have.some(
      (h) =>
        h === w ||
        h.endsWith(w) ||
        (h.startsWith(w) && h.length - w.length <= 2) ||
        (w.startsWith(h) && w.length - h.length <= 2),
    ),
  );
}
