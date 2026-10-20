/** Date helpers. Everything local-time; the app never talks to a server. */

export const DAY_MS = 86_400_000;

export function dayKey(d: Date | string | number = new Date()): string {
  const dt = d instanceof Date ? d : new Date(d);
  const m = `${dt.getMonth() + 1}`.padStart(2, '0');
  const day = `${dt.getDate()}`.padStart(2, '0');
  return `${dt.getFullYear()}-${m}-${day}`;
}

export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function startOfDay(d: Date = new Date()): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/**
 * Add a calendar-aware interval. "every 1 month" from Jan 31 lands on Feb 28/29,
 * not March 2nd — the same rule the real app uses.
 */
export function addInterval(d: Date, every: number, unit: Unit): Date {
  const c = new Date(d);
  if (unit === 'day') c.setDate(c.getDate() + every);
  else if (unit === 'week') c.setDate(c.getDate() + every * 7);
  else if (unit === 'month') {
    const targetDay = c.getDate();
    c.setDate(1);
    c.setMonth(c.getMonth() + every);
    const lastDay = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
    c.setDate(Math.min(targetDay, lastDay));
  } else {
    const targetDay = c.getDate();
    const targetMonth = c.getMonth();
    c.setDate(1);
    c.setFullYear(c.getFullYear() + every);
    const lastDay = new Date(c.getFullYear(), targetMonth + 1, 0).getDate();
    c.setMonth(targetMonth);
    c.setDate(Math.min(targetDay, lastDay));
  }
  return c;
}

export type Unit = 'day' | 'week' | 'month' | 'year';

/** Length of one cleaning cycle in milliseconds, anchored at `from`. */
export function cycleMs(from: Date, every: number, unit: Unit): number {
  return addInterval(from, every, unit).getTime() - from.getTime();
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const d1 = startOfDay(typeof a === 'string' ? fromDayKey(a) : a);
  const d2 = startOfDay(typeof b === 'string' ? fromDayKey(b) : b);
  return Math.round((d2.getTime() - d1.getTime()) / DAY_MS);
}

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const weekdayShort = (d: Date) => WEEK[d.getDay()];
export const weekdayLong = (d: Date) => WEEK_LONG[d.getDay()];
export const monthShort = (d: Date) => MONTH[d.getMonth()];

export function longDate(d: Date): string {
  return `${WEEK[d.getDay()]} · ${WEEK[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()].toUpperCase()}`;
}

export function headerDate(d: Date): string {
  return `${WEEK[d.getDay()].toUpperCase()} · ${d.getDate()} ${MONTH[d.getMonth()].toUpperCase()}`;
}

/** "Today", "Yesterday", "3 days ago", then a date. */
export function lastDoneLabel(iso?: string | null): string {
  if (!iso) return 'Never done';
  const d = new Date(iso);
  const diff = daysBetween(d, new Date());
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return 'Last week';
  return `${d.getDate()} ${MONTH[d.getMonth()]}`;
}

export function clockTime(d: Date): string {
  const h = d.getHours();
  const m = `${d.getMinutes()}`.padStart(2, '0');
  return `${h}:${m}`;
}

export function mmss(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${`${s % 60}`.padStart(2, '0')}`;
}

export function humanMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}
