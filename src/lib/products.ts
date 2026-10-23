import { guessFor, type Place } from '../data/units';

/**
 * Barcode lookup, via Open Food Facts and its sibling databases.
 *
 * This is the one place in the app that talks to the internet, and only when
 * you point the camera at something. Nothing about you is sent — just the
 * number printed on the packet. It can be turned off in Settings, and a failed
 * lookup is never fatal: you get an empty row to fill in by hand.
 *
 * REWE's own product endpoint used to answer this and no longer resolves, so
 * there is nothing to reverse-engineer here. Open Food Facts is an open
 * database with a documented public API and about 425k products sold in
 * Germany.
 */

export interface Product {
  ean: string;
  name: string;
  brand?: string;
  qty?: number;
  unit?: string;
  place: Place;
  /** false when the lookup found nothing and you have to type it yourself */
  found: boolean;
  /**
   * Other words for it, for the best-before lookup: Open Food Facts
   * categories (most specific first) and the English or generic name. A jar
   * labelled only in Korean still says "en:kimchi" here.
   */
  hints?: string[];
}

const DBS = [
  'https://world.openfoodfacts.org',
  'https://world.openproductsfacts.org',
  'https://world.openbeautyfacts.org',
];

const FIELDS =
  'product_name,product_name_de,product_name_en,generic_name,generic_name_de,generic_name_en,brands,quantity,product_quantity,product_quantity_unit,categories_tags';

const HEADERS = {
  // Open Food Facts asks apps to identify themselves.
  'User-Agent': 'Homeorg/1.0 (local household app)',
  Accept: 'application/json',
};

/** "1,5 l", "500g", "6 x 0.33l" — take the first number and unit we can see. */
function parseQuantity(text?: string): { qty: number; unit: string } | null {
  if (!text) return null;
  const m = text
    .toLowerCase()
    .replace(',', '.')
    .match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl|stück|stk|st|x)?/);
  if (!m) return null;

  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;

  switch (m[2]) {
    case 'kg':
      return { qty: n, unit: 'kg' };
    case 'g':
      return { qty: n, unit: 'g' };
    case 'l':
      return { qty: n, unit: 'l' };
    case 'ml':
      return { qty: n, unit: 'ml' };
    case 'cl':
      return { qty: n * 10, unit: 'ml' };
    default:
      return { qty: n, unit: 'pc' };
  }
}

/** The normalised fields are always in g/ml — turn the big ones back into kg/l. */
function fromNormalised(value?: number, unit?: string): { qty: number; unit: string } | null {
  if (!value || !Number.isFinite(value)) return null;
  if (unit === 'g') return value >= 1000 ? { qty: value / 1000, unit: 'kg' } : { qty: value, unit: 'g' };
  if (unit === 'ml') return value >= 1000 ? { qty: value / 1000, unit: 'l' } : { qty: value, unit: 'ml' };
  return null;
}

/** "Pesto Genovese" from Barilla should read "Barilla Pesto Genovese" on a shelf. */
function tidyName(raw: string, brand?: string): string {
  let name = raw.trim().replace(/\s+/g, ' ');
  const first = brand?.split(',')[0]?.trim();
  if (first && !name.toLowerCase().includes(first.toLowerCase())) {
    name = `${first} ${name}`;
  }
  return name.length > 40 ? `${name.slice(0, 39).trimEnd()}…` : name;
}

/**
 * Where it goes. Open Food Facts categories are language-neutral, so they beat
 * guessing from a German product name — that's only the fallback.
 */
function placeFrom(tags: string[] | undefined, name: string): Place {
  const has = (needle: string) => tags?.some((t) => t.includes(needle)) ?? false;

  if (has('frozen') || has('ice-cream')) return 'freezer';
  if (
    has('dairies') ||
    has('cheese') ||
    has('yogurt') ||
    has('milk') ||
    has('cream') ||
    has('butter') ||
    has('eggs') ||
    has('meat') ||
    has('poultry') ||
    has('charcuteries') ||
    has('sausage') ||
    has('fishes') ||
    has('seafood') ||
    has('fresh-') ||
    has('fermented')
  ) {
    return 'fridge';
  }
  if (has('beverages') || has('groceries') || has('canned') || has('pasta') || has('cereals')) {
    return 'pantry';
  }
  return guessFor(name).place;
}

/** Categories narrowest first, then other names; a handful is plenty. */
export function hintsFrom(p: {
  categories_tags?: string[];
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  generic_name_en?: string;
}): string[] {
  const tags = [...(p.categories_tags ?? [])].reverse().filter((t) => t.startsWith('en:'));
  const names = [p.product_name_en, p.generic_name_en, p.generic_name, p.product_name].filter(
    (n): n is string => !!n?.trim(),
  );
  return [...new Set([...tags.slice(0, 6), ...names])].slice(0, 9);
}

async function askOne(base: string, ean: string, signal: AbortSignal): Promise<Product | null> {
  const res = await fetch(`${base}/api/v2/product/${ean}.json?fields=${FIELDS}`, {
    headers: HEADERS,
    signal,
  });
  if (!res.ok) return null;

  const json: {
    product?: {
      product_name?: string;
      product_name_de?: string;
      product_name_en?: string;
      generic_name?: string;
      generic_name_de?: string;
      generic_name_en?: string;
      brands?: string;
      quantity?: string;
      product_quantity?: number;
      product_quantity_unit?: string;
      categories_tags?: string[];
    };
  } = await res.json();

  const p = json.product;
  const raw = p?.product_name_de || p?.product_name || p?.generic_name_de;
  if (!p || !raw) return null;

  const brand = p.brands?.split(',')[0]?.trim();
  const name = tidyName(raw, brand);
  // the printed quantity reads better than the normalised one: "1.5 l" not "1500 ml"
  const size = parseQuantity(p.quantity) ?? fromNormalised(p.product_quantity, p.product_quantity_unit);
  const guess = guessFor(`${name} ${brand ?? ''}`);

  return {
    ean,
    name,
    brand,
    qty: size?.qty,
    unit: size?.unit ?? guess.unit,
    place: placeFrom(p.categories_tags, name),
    found: true,
    hints: hintsFrom(p),
  };
}

/** Nothing here throws — a barcode you can't look up is still a barcode. */
export async function lookupBarcode(ean: string, timeoutMs = 6000): Promise<Product> {
  const blank: Product = { ean, name: '', place: 'pantry', unit: 'pc', found: false };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (const base of DBS) {
      try {
        const hit = await askOne(base, ean, controller.signal);
        if (hit) return hit;
      } catch {
        // try the next database, or fall through to the blank row
      }
      if (controller.signal.aborted) break;
    }
    return blank;
  } finally {
    clearTimeout(timer);
  }
}
