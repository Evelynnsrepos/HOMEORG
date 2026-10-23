/**
 * Reads the 2D codes that are replacing the plain barcode on packaging: GS1
 * Digital Link QR codes and GS1 DataMatrix. Besides the product number they
 * can carry the actual date on this packet, which is what we're after:
 *
 *   https://id.gs1.org/01/09506000134352/10/ABC?17=271231     Digital Link
 *   (01)09506000134352(17)271231(10)ABC                       human-readable
 *   0109506000134352172712311 0ABC  (with ASCII 29 between)   what a scanner hands over
 *
 * Application identifiers we use: 01 the GTIN, 17 use-by/expiry, 15 best
 * before, 16 sell by (a last resort). Dates are YYMMDD; a day of 00 means the
 * end of that month.
 */

export interface Gs1 {
  /** the product number, as the EAN-13 a database knows when it fits */
  gtin?: string;
  /** day key */
  expiry?: string;
  /** which identifier the date came from */
  dateKind?: 'use-by' | 'best-before' | 'sell-by';
}

const GS = '\u001d';

/**
 * Fixed-length fields: how many characters follow the first two digits of the
 * AI. For 31xx–36xx that's two more AI digits plus six of data; for 41x one
 * more AI digit plus thirteen.
 */
const FIXED: Record<string, number> = {
  '00': 18, '01': 14, '02': 14, '03': 14, '04': 16,
  '11': 6, '12': 6, '13': 6, '15': 6, '16': 6, '17': 6,
  '20': 2, '31': 8, '32': 8, '33': 8, '34': 8, '35': 8, '36': 8, '41': 14,
};

/** "271231" -> "2027-12-31", "270200" -> "2027-02-28". */
export function gs1Date(yymmdd: string): string | undefined {
  if (!/^\d{6}$/.test(yymmdd)) return undefined;
  const yy = Number(yymmdd.slice(0, 2));
  const mm = Number(yymmdd.slice(2, 4));
  let dd = Number(yymmdd.slice(4, 6));
  if (mm < 1 || mm > 12) return undefined;
  // the GS1 rule: within 49 years ahead or 50 back of now
  const now = new Date().getFullYear();
  let year = 2000 + yy;
  if (year - now > 49) year -= 100;
  if (dd === 0) dd = new Date(year, mm, 0).getDate();
  if (dd > new Date(year, mm, 0).getDate()) return undefined;
  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function shortGtin(gtin: string): string {
  // a GTIN-14 with a leading zero is an EAN-13; with two, a UPC-A; keep it simple
  return gtin.length === 14 && gtin.startsWith('0') ? gtin.slice(1) : gtin;
}

/** The identifier → value pairs in an element string, with or without brackets. */
function elements(data: string): Map<string, string> {
  const out = new Map<string, string>();
  if (data.includes('(')) {
    for (const m of data.matchAll(/\((\d{2,4})\)([^(]*)/g)) out.set(m[1], m[2].trim());
    return out;
  }
  let s = data.replace(/^\][A-Za-z]\d/, ''); // symbology prefix, e.g. ]d2
  while (s.length >= 2) {
    if (s[0] === GS) {
      s = s.slice(1);
      continue;
    }
    const two = s.slice(0, 2);
    const fixed = FIXED[two];
    // 3- and 4-digit AIs: 31xx..36xx carry a decimal digit, 410-417 are 3 long
    const aiLen = ['31', '32', '33', '34', '35', '36'].includes(two) ? 4 : two === '41' ? 3 : 2;
    const ai = s.slice(0, aiLen);
    if (fixed) {
      const len = aiLen === 2 ? fixed : fixed - (aiLen - 2);
      out.set(ai, s.slice(aiLen, aiLen + len));
      s = s.slice(aiLen + len);
    } else {
      // variable length: up to the next separator, or the end
      const cut = s.indexOf(GS, 2);
      const end = cut < 0 ? s.length : cut;
      out.set(two, s.slice(2, end));
      s = s.slice(end);
    }
  }
  return out;
}

/** Path pairs and query parameters of a Digital Link URL. */
function digitalLink(url: string): Map<string, string> | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const out = new Map<string, string>();
  const parts = u.pathname.split('/').filter(Boolean);
  const at = parts.findIndex((p) => /^(01|gtin)$/.test(p));
  if (at < 0) return null;
  for (let i = at; i + 1 < parts.length; i += 2) {
    out.set(parts[i] === 'gtin' ? '01' : parts[i], decodeURIComponent(parts[i + 1]));
  }
  u.searchParams.forEach((v, k) => {
    if (/^\d{2,4}$/.test(k)) out.set(k, v);
  });
  return out;
}

/**
 * Whatever came off the camera. Returns null when it isn't a GS1 code at all
 * (a plain EAN, a web link, a Wi-Fi QR code) so the caller can carry on.
 */
export function parseGs1(data: string): Gs1 | null {
  const raw = data.trim();
  let ai: Map<string, string> | null = null;
  if (/^https?:\/\//i.test(raw)) ai = digitalLink(raw);
  else if (/^\(\d{2}\)/.test(raw) || /^(\][A-Za-z]\d)?01\d{14}/.test(raw) || raw.includes(GS)) ai = elements(raw);
  if (!ai || (!ai.get('01') && !ai.get('17') && !ai.get('15'))) return null;

  const gtin = ai.get('01');
  const out: Gs1 = {};
  if (gtin && /^\d{8,14}$/.test(gtin)) out.gtin = shortGtin(gtin);
  for (const [key, kind] of [
    ['17', 'use-by'],
    ['15', 'best-before'],
    ['16', 'sell-by'],
  ] as const) {
    const day = ai.get(key) && gs1Date(ai.get(key)!);
    if (day) {
      out.expiry = day;
      out.dateKind = kind;
      break;
    }
  }
  return out;
}
