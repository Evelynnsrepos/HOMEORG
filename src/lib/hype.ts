import { dayKey } from './date';
import { creditedMinutes } from './engine';
import type { Completion, CookedMeal, Recipe, Room, SprintRecord, Task } from './types';

/**
 * The numbers behind the History screen, read the kindest way. Insights asks
 * "what happened"; this asks "what went well" — every line is something you
 * did, never something you missed.
 */

export interface Hype {
  chores: number;
  minutes: number;
  cooked: number;
  /** distinct dishes cooked */
  dishes: number;
  sprints: number;
  bestStreak: number;
  /** this rolling week and the one before */
  week: number;
  lastWeek: number;
  /** "You did this", one cheer per line, best first */
  cheers: { emoji: string; text: string }[];
}

export function hourLabel(h: number): string {
  if (h === 0) return 'midnight';
  if (h === 12) return 'noon';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export function buildHype(input: {
  completions: Completion[];
  tasks: Task[];
  rooms: Room[];
  recipes: Recipe[];
  cookLog: CookedMeal[];
  sprints: SprintRecord[];
  bestStreak: number;
  now?: Date;
}): Hype {
  const { completions, tasks, rooms, recipes, cookLog, sprints, bestStreak } = input;
  const now = (input.now ?? new Date()).getTime();
  const minutes = Math.round(completions.reduce((s, c) => s + creditedMinutes(c, tasks), 0));

  // dishes cooked before the log existed only left a date on the recipe
  const logged = new Set(cookLog.map((c) => c.recipeId));
  const cooked = cookLog.length + recipes.filter((r) => r.lastCooked && !logged.has(r.id)).length;
  const dishes = new Set([...logged, ...recipes.filter((r) => r.lastCooked).map((r) => r.id)]).size;

  const inWeek = (back: number) =>
    completions.filter((c) => {
      const t = new Date(c.at).getTime();
      return t >= now - (back + 1) * 7 * 86_400_000 && t < now - back * 7 * 86_400_000;
    }).length;
  const week = inWeek(0);
  const lastWeek = inWeek(1);

  const cheers: { emoji: string; text: string }[] = [];

  if (week && week >= lastWeek && lastWeek) {
    cheers.push({ emoji: '🚀', text: `${week - lastWeek ? `${week - lastWeek} more chores than last week.` : 'Just as many chores as last week.'} You're on a roll!` });
  } else if (week) {
    cheers.push({ emoji: '💪', text: `${week} ${week === 1 ? 'chore' : 'chores'} this week. Every single one counts.` });
  }

  const roomCount = new Map<string, number>();
  for (const c of completions) roomCount.set(c.roomId, (roomCount.get(c.roomId) ?? 0) + 1);
  const fav = [...roomCount.entries()].sort((a, b) => b[1] - a[1])[0];
  const favRoom = fav && rooms.find((r) => r.id === fav[0]);
  if (favRoom) cheers.push({ emoji: favRoom.emoji, text: `${favRoom.name} has had ${fav[1]} rounds of love from you.` });

  const hours = Array(24).fill(0) as number[];
  for (const c of completions) hours[new Date(c.at).getHours()]++;
  const peak = hours.indexOf(Math.max(...hours));
  if (completions.length >= 5) cheers.push({ emoji: '⏰', text: `Your power hour is around ${hourLabel(peak)}. Unstoppable.` });

  const byDish = new Map<string, number>();
  for (const c of cookLog) byDish.set(c.name, (byDish.get(c.name) ?? 0) + 1);
  const signature = [...byDish.entries()].sort((a, b) => b[1] - a[1])[0];
  if (signature && signature[1] > 1) {
    cheers.push({ emoji: '👩‍🍳', text: `${signature[0]} is your signature dish, cooked ${signature[1]} times.` });
  } else if (cooked) {
    cheers.push({ emoji: '🍳', text: `${cooked} home-cooked ${cooked === 1 ? 'meal' : 'meals'}. Your kitchen is proud of you.` });
  }

  const deep = completions.filter((c) => tasks.find((t) => t.id === c.taskId)?.effort === 'deep').length;
  if (deep) cheers.push({ emoji: '🧽', text: `${deep} deep ${deep === 1 ? 'clean' : 'cleans'}. The big ones, done.` });

  if (sprints.length) {
    const sprintMin = sprints.reduce((s, x) => s + x.minutes, 0);
    cheers.push({ emoji: '⚡', text: `${sprints.length} ${sprints.length === 1 ? 'sprint' : 'sprints'}, ${sprintMin} focused minutes.` });
  }

  const days = new Set(completions.map((c) => dayKey(c.at))).size;
  if (days > 1) cheers.push({ emoji: '📅', text: `You showed up for your home on ${days} different days.` });

  if (minutes >= 60) {
    const episodes = Math.floor(minutes / 24);
    cheers.push({ emoji: '📺', text: `${minutes} minutes of care: that's ${episodes} sitcom ${episodes === 1 ? 'episode' : 'episodes'} worth.` });
  }

  return {
    chores: completions.length,
    minutes,
    cooked,
    dishes,
    sprints: sprints.length,
    bestStreak,
    week,
    lastWeek,
    cheers,
  };
}

/** A headline that fits how much there is to celebrate. */
export function hypeTitle(chores: number, cooked: number): string {
  const n = chores + cooked;
  if (!n) return 'Your story starts here';
  if (n < 5) return 'Look at you go!';
  if (n < 25) return "You're doing amazing!";
  if (n < 100) return 'Household hero!';
  return 'Absolute legend!';
}
