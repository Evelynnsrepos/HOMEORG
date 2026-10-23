/**
 * Coins, and where they come from. Almost everything that keeps a home
 * running pays a little: cleaning, cooking, before and after photos, putting
 * shopping away, writing down a best-before, checking in on how you feel.
 * There is no other way to get them — no shop, no purchases, ever.
 *
 * Each source has a daily cap, so adding and deleting the same yoghurt twenty
 * times doesn't print money; a normal day never gets near one.
 */
export type RewardSource =
  | 'chore'
  | 'cook'
  | 'photo'
  | 'pantry'
  | 'bestBefore'
  | 'import'
  | 'shopping'
  | 'recipe'
  | 'note'
  | 'mood'
  | 'streakDay'
  | 'streakWeek';

export const REWARDS: Record<RewardSource, { coins: number; dailyCap: number; label: string }> = {
  chore: { coins: 0, dailyCap: Infinity, label: 'Chore done' }, // priced by effort in the engine
  cook: { coins: 15, dailyCap: 45, label: 'Home cooked' },
  photo: { coins: 10, dailyCap: 60, label: 'Before & after' },
  pantry: { coins: 2, dailyCap: 40, label: 'On the shelf' },
  bestBefore: { coins: 3, dailyCap: 30, label: 'Best-before noted' },
  import: { coins: 25, dailyCap: 50, label: 'Shop put away' },
  shopping: { coins: 1, dailyCap: 15, label: 'Ticked off' },
  recipe: { coins: 10, dailyCap: 30, label: 'Recipe saved' },
  note: { coins: 3, dailyCap: 9, label: 'Info pinned' },
  mood: { coins: 10, dailyCap: 10, label: 'Checked in' },
  streakDay: { coins: 5, dailyCap: 15, label: 'Streak kept' },
  streakWeek: { coins: 40, dailyCap: 100, label: 'Week streak' },
};

export interface CoinEvent {
  /** day key */
  day: string;
  source: RewardSource;
  coins: number;
}

/** How many of `coins` from `source` still fit under today's cap. */
export function allowed(log: CoinEvent[], source: RewardSource, day: string, coins: number): number {
  const cap = REWARDS[source].dailyCap;
  if (cap === Infinity) return coins;
  const today = log.reduce((s, e) => (e.day === day && e.source === source ? s + e.coins : s), 0);
  return Math.max(0, Math.min(coins, cap - today));
}

/** Keep the log short: what the caps and the data screen need. */
export function trimLog(log: CoinEvent[], keepDays = 400): CoinEvent[] {
  const cutoff = new Date(Date.now() - keepDays * 86_400_000).toISOString().slice(0, 10);
  return log.filter((e) => e.day >= cutoff);
}
