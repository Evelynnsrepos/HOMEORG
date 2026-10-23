import { addDays, dayKey, daysBetween } from './date';

/**
 * Streaks that don't punish a bad week. Any day you did something for your
 * home counts — a chore, cooking, a check-in, putting shopping away. You pick
 * a rhythm (every day, every two or three days, once a week) and there are
 * grace days on top, so the chain only breaks when you've really been gone
 * for a while. Some weeks you just don't have it in you, and that's fine.
 */
export interface StreakSettings {
  /** show up at least every N days */
  every: number;
  /** extra days before it breaks */
  grace: number;
  /** active days that make a week count */
  weekGoal: number;
}

export const DEFAULT_STREAK: StreakSettings = { every: 1, grace: 2, weekGoal: 3 };

export interface Streak {
  /** active days in the current chain */
  days: number;
  /** consecutive weeks that met the goal (this week counts once it does) */
  weeks: number;
  /** days left before the chain breaks, 0 when it's already broken */
  safeFor: number;
  /** active days so far this week (Monday to Sunday) */
  thisWeek: number;
}

function monday(d: Date): Date {
  const m = new Date(d);
  m.setHours(12, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

export function streakOf(active: Set<string>, s: StreakSettings = DEFAULT_STREAK, today = new Date()): Streak {
  const limit = s.every + s.grace;
  const sorted = [...active].filter((d) => d <= dayKey(today)).sort().reverse();

  // the chain: back from the newest active day while the gaps stay within the limit
  let days = 0;
  let safeFor = 0;
  if (sorted.length && daysBetween(sorted[0], dayKey(today)) <= limit) {
    days = 1;
    safeFor = limit - daysBetween(sorted[0], dayKey(today)) + 1;
    for (let i = 1; i < sorted.length && daysBetween(sorted[i], sorted[i - 1]) <= limit; i++) days++;
  }

  // weeks: this one counts once it meets the goal, an unfinished one doesn't break the run
  const countIn = (start: Date) => {
    let n = 0;
    for (let i = 0; i < 7; i++) if (active.has(dayKey(addDays(start, i)))) n++;
    return n;
  };
  const thisMonday = monday(today);
  const thisWeek = countIn(thisMonday);
  let weeks = thisWeek >= s.weekGoal ? 1 : 0;
  for (let w = 1; w < 520; w++) {
    if (countIn(addDays(thisMonday, -7 * w)) >= s.weekGoal) weeks++;
    else break;
  }

  return { days, weeks, safeFor, thisWeek };
}

/** Everything that counts as showing up, as day keys. */
export function activeDays(sources: { at?: string; day?: string }[][]): Set<string> {
  const out = new Set<string>();
  for (const list of sources) for (const e of list) out.add(e.day ?? dayKey(e.at!));
  return out;
}

export function weekStartKey(d = new Date()): string {
  return dayKey(monday(d));
}

