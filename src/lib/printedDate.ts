/**
 * Finds the best-before in text read off a packet by the camera. Packets
 * from a German supermarket, a Turkish, Indian, Japanese or Taiwanese shop all
 * print it differently, so this collects every date it can read, scores each
 * by the words around it, and picks the most likely one.
 *
 *   MHD 31.12.2026 · mindestens haltbar bis: 12/2026          German
 *   BEST BEFORE 31 DEC 2026 · EXP 2026/12 · BBE: 12.03.27     English
 *   SKT: 31.12.2026 · TETT 31 Aralık 2026                     Turkish
 *   MFD 01/2026, Best before 12 months from manufacture       Indian
 *   賞味期限 2026.12.31 · 26.12.31 · 2026年12月31日            Japanese
 *   有效日期 115.12.31 (民國) · 2026/12/31                     Taiwanese
 *   유통기한 2026.12.31까지                                     Korean
 *
 * Day-first wins when it's ambiguous (12/03 is the 12th of March), except
 * with East Asian text around it, where year-first is the custom.
 */

export interface PrintedDate {
  /** day key */
  date: string;
  /** the bit of text it came from */
  source: string;
  /** an expiry word was right there, so this is not a guess between dates */
  labelled: boolean;
}

const EXPIRY = [
  'mhd', 'mindestens haltbar', 'haltbar bis', 'zu verbrauchen', 'verbrauchen bis', 'verbr', 'ablauf',
  'best before', 'best by', 'bbe', 'bb', 'exp', 'expiry', 'expires', 'use by', 'use before', 'consume before',
  'skt', 'son kullanma', 'tett', 'tüketim', 'tuketim',
  '賞味期限', '消費期限', '有效日期', '有效期限', '保存期限', '到期', '賞味', '期限',
  '유통기한', '소비기한', '사용기한', '까지',
  'उपयोग', 'समाप्ति', 'à consommer', 'a consumir', 'consumir antes', 'da consumarsi', 'tht', 'ten minste houdbaar',
];
const MADE = [
  'mfg', 'mfd', 'manufactured', 'manufacture', 'mfd on', 'pkd', 'packed', 'packaging', 'prod', 'herstell', 'abgefüllt',
  'üretim', 'uretim', 'ürt', '製造', '製造日', '生產', '生产', '제조', '생산', 'निर्माण', 'lot', 'charge',
];

const MONTHS: Record<string, number> = {};
const monthNames: [string[], number][] = [
  [['jan', 'january', 'januar', 'jän', 'ocak', 'ock'], 1],
  [['feb', 'february', 'februar', 'şubat', 'subat', 'şub'], 2],
  [['mar', 'march', 'märz', 'maerz', 'mär', 'mart'], 3],
  [['apr', 'april', 'nisan', 'nis'], 4],
  [['may', 'mai', 'mayıs', 'mayis', 'may'], 5],
  [['jun', 'june', 'juni', 'haziran', 'haz'], 6],
  [['jul', 'july', 'juli', 'temmuz', 'tem'], 7],
  [['aug', 'august', 'ağustos', 'agustos', 'ağu'], 8],
  [['sep', 'sept', 'september', 'eylül', 'eylul', 'eyl'], 9],
  [['oct', 'october', 'okt', 'oktober', 'ekim', 'eki'], 10],
  [['nov', 'november', 'kasım', 'kasim', 'kas'], 11],
  [['dec', 'december', 'dez', 'dezember', 'aralık', 'aralik', 'ara'], 12],
];
for (const [names, m] of monthNames) for (const n of names) MONTHS[n] = m;
const MONTH_RE = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .join('|');

const CJK = /[぀-ヿ㐀-鿿가-힯]/;

function lastDay(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function key(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > lastDay(y, m)) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function fullYear(y: number, now: number, roc = false): number {
  if (roc || (y >= 100 && y < 200)) return y + 1911; // Taiwan's Minguo calendar
  if (y < 100) return 2000 + y;
  return y;
}

interface Found {
  date: string;
  at: number;
  end: number;
  text: string;
}

/** Every date-looking thing in one line of text. */
function datesIn(line: string, eastAsian: boolean, now: Date): Found[] {
  const out: Found[] = [];
  const year = now.getFullYear();
  const add = (date: string | null, m: RegExpMatchArray) => {
    if (date) out.push({ date, at: m.index ?? 0, end: (m.index ?? 0) + m[0].length, text: m[0] });
  };
  const taken = (m: RegExpMatchArray) => out.some((f) => (m.index ?? 0) < f.end && (m.index ?? 0) + m[0].length > f.at);

  // 2026年12月31日, 26年12月31日, 民國115年12月31日
  for (const m of line.matchAll(/(民國|民国)?\s*(\d{2,4})\s*年\s*(\d{1,2})\s*月\s*(?:(\d{1,2})\s*日)?/g)) {
    const y = fullYear(Number(m[2]), year, !!m[1]);
    add(key(y, Number(m[3]), m[4] ? Number(m[4]) : lastDay(y, Number(m[3]))), m);
  }
  // 2026-12-31, 2026.12.31, 2026/12/31, 115.12.31 (ROC)
  for (const m of line.matchAll(/(?<!\d)(\d{3,4})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})(?!\d)/g)) {
    if (taken(m)) continue;
    add(key(fullYear(Number(m[1]), year), Number(m[2]), Number(m[3])), m);
  }
  // 31 DEC 2026, 31. Dezember 2026, 31 Aralık 26, DEC 2026, 12 OCT 26
  // letters spelled out rather than \\p{L}, which not every JS engine on a phone has
  const named = new RegExp(`(?<![A-Za-zÀ-žĞğİıŞş\\d])(?:(\\d{1,2})\\.?\\s*)?(${MONTH_RE})\\.?\\s*(\\d{2,4})(?!\\d)`, 'gi');
  for (const m of line.matchAll(named)) {
    if (taken(m)) continue;
    const mo = MONTHS[m[2].toLowerCase()];
    const y = fullYear(Number(m[3]), year);
    add(key(y, mo, m[1] ? Number(m[1]) : lastDay(y, mo)), m);
  }
  // 31.12.2026, 31/12/26, 12-03-27 — or 26.12.31 with East Asian text around
  for (const m of line.matchAll(/(?<!\d)(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{2}|\d{4})(?!\d)/g)) {
    if (taken(m)) continue;
    const [a, b, c] = [Number(m[1]), Number(m[2]), Number(m[3])];
    let date: string | null = null;
    if (m[3].length === 2 && eastAsian) date = key(2000 + a, b, c);
    if (!date) date = key(fullYear(c, year), b, a); // day first
    if (!date) date = key(fullYear(c, year), a, b); // a US-style label after all
    add(date, m);
  }
  // 12/2026, 12.26, 2026/12 — month and year: the end of that month
  for (const m of line.matchAll(/(?<![\d./-])(\d{1,2})\s*[./-]\s*(\d{4}|\d{2})(?![\d./-])/g)) {
    if (taken(m)) continue;
    const mo = Number(m[1]);
    const y = fullYear(Number(m[2]), year);
    if (m[2].length === 2 && (Number(m[2]) < year % 100 - 1 || Number(m[2]) > year % 100 + 10)) continue;
    add(key(y, mo, lastDay(y, mo)), m);
  }
  for (const m of line.matchAll(/(?<![\d./-])(\d{4})\s*[./-]\s*(\d{1,2})(?![\d./-])/g)) {
    if (taken(m)) continue;
    const y = Number(m[1]);
    add(key(y, Number(m[2]), lastDay(y, Number(m[2]))), m);
  }
  return out;
}

const hasWord = (text: string, words: string[]) => {
  const t = text.toLowerCase();
  return words.some((w) => (/^[a-z]+$/.test(w) && w.length <= 4 ? new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(t) : t.includes(w)));
};

/** "best before 12 months from manufacture" and the like, with the date it counts from. */
function relative(text: string, made: string | undefined): string | undefined {
  if (!made) return undefined;
  const m = text
    .toLowerCase()
    .match(/(?:best before|use within|consume within|expiry|exp\.?)\D{0,20}?(\d{1,2})\s*(months?|days?|weeks?|years?)\s*(?:from|after|of)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  const d = new Date(`${made}T12:00:00`);
  if (m[2].startsWith('month')) d.setMonth(d.getMonth() + n);
  else if (m[2].startsWith('year')) d.setFullYear(d.getFullYear() + n);
  else d.setDate(d.getDate() + n * (m[2].startsWith('week') ? 7 : 1));
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Text recognition reads a 0 as O and a 1 as l or I now and then. Between
 * digits and date separators they can only be digits.
 */
function ocrDigits(line: string): string {
  let out = line;
  for (let i = 0; i < 2; i++) {
    out = out
      .replace(/(?<=[\d./-])[Oo](?=[\d./-])/g, '0')
      .replace(/(?<=[\d./-])[Il|](?=[\d./-])/g, '1')
      .replace(/(?<=\d[./-]\d?)[Oo](?=\d)/g, '0');
  }
  return out;
}

/**
 * The best-before printed in `text` (what the camera read), or null. Only
 * dates from last year to ten years out count; a date on its own line under
 * an expiry word counts as labelled too.
 */
export function findPrintedDate(text: string, now = new Date()): PrintedDate | null {
  const eastAsian = CJK.test(text);
  const lines = text
    .split(/\r?\n/)
    .map((l) => ocrDigits(l).trim())
    .filter(Boolean);
  const today = now.toISOString().slice(0, 10);
  const lo = `${now.getFullYear() - 1}-01-01`;
  const hi = `${now.getFullYear() + 10}-12-31`;

  const scored: (PrintedDate & { score: number })[] = [];
  let madeOn: string | undefined;

  lines.forEach((line, i) => {
    for (const f of datesIn(line, eastAsian, now)) {
      if (f.date < lo || f.date > hi) continue;
      const before = line.slice(0, f.at);
      const prev = i ? lines[i - 1] : '';
      const near = before.slice(-30);
      const exp = hasWord(near, EXPIRY) || (!before.trim() && hasWord(prev, EXPIRY) && !hasWord(prev, MADE));
      const made = hasWord(near, MADE) || (!before.trim() && hasWord(prev, MADE));
      if (made && !exp) {
        madeOn = madeOn ?? f.date;
        continue;
      }
      let score = exp ? 10 : 0;
      if (f.date >= today) score += 2;
      scored.push({ date: f.date, source: f.text, labelled: exp, score });
    }
  });

  const fromMade = relative(text, madeOn);
  if (fromMade && !scored.some((s) => s.labelled)) {
    return { date: fromMade, source: 'from the manufacture date', labelled: true };
  }
  if (!scored.length) return null;
  // the best-scored; among equals the latest, since an expiry comes after the other dates on a pack
  scored.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
  const { score: _s, ...best } = scored[0];
  return best;
}
