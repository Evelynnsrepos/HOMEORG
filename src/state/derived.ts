import { useMemo } from 'react';

import type { AchievementInput } from '../data/achievements';
import { dayKey } from '../lib/date';
import {
  creditedMinutes,
  longestStreak,
  overallHealth,
  planWeek,
  roomsWithHealth,
  streakDays,
  type DayPlan,
} from '../lib/engine';
import type { Task } from '../lib/types';
import { useStore } from './store';

/** Recompute at most once a minute — cleanliness moves slowly. */
function useTick() {
  const minute = Math.floor(Date.now() / 60_000);
  return minute;
}

export function useWeekPlan(days = 7): DayPlan[] {
  const tasks = useStore((s) => s.tasks);
  const settings = useStore((s) => s.settings);
  const completions = useStore((s) => s.completions);
  const tick = useTick();

  const doneToday = useMemo(() => {
    const key = dayKey();
    return new Set(completions.filter((c) => dayKey(c.at) === key).map((c) => c.taskId));
  }, [completions]);

  return useMemo(
    () => planWeek(tasks, settings, days, doneToday),
    [tasks, settings, days, doneToday, tick],
  );
}

export function useToday(): DayPlan {
  return useWeekPlan(1)[0];
}

export function useRooms() {
  const rooms = useStore((s) => s.rooms);
  const tasks = useStore((s) => s.tasks);
  const tick = useTick();
  return useMemo(() => roomsWithHealth(rooms, tasks), [rooms, tasks, tick]);
}

export function useHomeHealth() {
  const tasks = useStore((s) => s.tasks);
  const tick = useTick();
  return useMemo(() => overallHealth(tasks), [tasks, tick]);
}

export function useStreak() {
  const completions = useStore((s) => s.completions);
  const tick = useTick();
  return useMemo(() => streakDays(completions), [completions, tick]);
}

export interface WeekStats {
  tasks: number;
  minutes: number;
  streak: number;
  best: { tasks: number; minutes: number; streak: number };
  byDay: { key: string; count: number; minutes: number }[];
  byRoom: { roomId: string; count: number; minutes: number }[];
  byHour: number[];
}

/** The Insights numbers. "This week" is a rolling seven days, as in the app. */
export function useStats(): WeekStats {
  const completions = useStore((s) => s.completions);
  const tasks = useStore((s) => s.tasks);
  const tick = useTick();

  return useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 86_400_000;
    const week = completions.filter((c) => new Date(c.at).getTime() >= weekAgo);

    const byDay: { key: string; count: number; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000);
      const key = dayKey(d);
      const dayC = week.filter((c) => dayKey(c.at) === key);
      byDay.push({
        key,
        count: dayC.length,
        minutes: dayC.reduce((s, c) => s + creditedMinutes(c, tasks), 0),
      });
    }

    const roomMap = new Map<string, { count: number; minutes: number }>();
    for (const c of week) {
      const cur = roomMap.get(c.roomId) ?? { count: 0, minutes: 0 };
      cur.count++;
      cur.minutes += creditedMinutes(c, tasks);
      roomMap.set(c.roomId, cur);
    }

    const byHour = Array(24).fill(0) as number[];
    for (const c of completions) byHour[new Date(c.at).getHours()]++;

    return {
      tasks: week.length,
      minutes: Math.round(week.reduce((s, c) => s + creditedMinutes(c, tasks), 0)),
      streak: streakDays(completions),
      best: {
        tasks: completions.length,
        minutes: Math.round(completions.reduce((s, c) => s + creditedMinutes(c, tasks), 0)),
        streak: longestStreak(completions),
      },
      byDay,
      byRoom: [...roomMap.entries()].map(([roomId, v]) => ({ roomId, ...v })),
      byHour,
    };
  }, [completions, tasks, tick]);
}

const EFFORTS_FOR = {
  low: ['light'],
  medium: ['light', 'medium'],
  high: ['light', 'medium', 'deep'],
} as const;

/**
 * Everything Focus could offer, before the energy filter: today's capped list,
 * the "Got more time?" overflow behind it, and any open "Whenever" jobs.
 *
 * The overflow is in on purpose. Without it a light-work day would leave the
 * High setting with nothing to show, even though the deep jobs plainly exist.
 */
export function useFocusPool(roomId?: string): Task[] {
  const plan = useToday();
  const tasks = useStore((s) => s.tasks);
  const completions = useStore((s) => s.completions);

  return useMemo(() => {
    const key = dayKey();
    // What you actually ticked off — never guess from lastDone, since a
    // freshly seeded chore can carry today's date without you touching it.
    const done = new Set(
      completions.filter((c) => dayKey(c.at) === key).map((c) => c.taskId),
    );
    const whenever = tasks.filter((t) => t.kind === 'whenever' && !t.lastDone);

    const seen = new Set<string>();
    return [...plan.tasks, ...plan.overflow, ...whenever].filter((t) => {
      if (done.has(t.id) || seen.has(t.id)) return false;
      if (roomId && t.roomId !== roomId) return false;
      seen.add(t.id);
      return true;
    });
  }, [plan, tasks, completions, roomId]);
}

export function useFocusQueue(energy: 'low' | 'medium' | 'high', roomId?: string): Task[] {
  const pool = useFocusPool(roomId);
  return useMemo(
    () => pool.filter((t) => (EFFORTS_FOR[energy] as readonly string[]).includes(t.effort)),
    [pool, energy],
  );
}

/** How many tasks each energy level would give you, for the picker. */
export function useEnergyCounts(roomId?: string) {
  const pool = useFocusPool(roomId);
  return useMemo(
    () => ({
      low: pool.filter((t) => t.effort === 'light').length,
      medium: pool.filter((t) => t.effort !== 'deep').length,
      high: pool.length,
    }),
    [pool],
  );
}

export function useTaskById(id?: string) {
  return useStore((s) => s.tasks.find((t) => t.id === id));
}

/** Everything the achievement list needs, worked out from what's on the device. */
export function useAchievementInput(): AchievementInput {
  const completions = useStore((s) => s.completions);
  const tasks = useStore((s) => s.tasks);
  const coins = useStore((s) => s.coins);
  const inventory = useStore((s) => s.inventory);
  const sprints = useStore((s) => s.sprints);
  const challenges = useStore((s) => s.challenges);
  const rooms = useRooms();
  const tick = useTick();

  return useMemo(() => {
    const perDay = new Map<string, number>();
    let deepDone = 0;
    let focusDone = 0;
    let underTen = 0;
    let early = 0;
    let night = 0;

    for (const c of completions) {
      const key = dayKey(c.at);
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
      const t = tasks.find((x) => x.id === c.taskId);
      if (t?.effort === 'deep') deepDone++;
      if (c.source === 'focus') {
        focusDone++;
        if (c.minutes != null && c.minutes < 10) underTen++;
      }
      const h = new Date(c.at).getHours();
      if (h < 8) early++;
      if (h >= 22) night++;
    }

    return {
      completions: completions.length,
      streak: streakDays(completions),
      longestStreak: longestStreak(completions),
      minutes: Math.round(completions.reduce((s, c) => s + creditedMinutes(c, tasks), 0)),
      coins,
      itemsOwned: inventory.length,
      rooms: rooms.length,
      roomsSparkling: rooms.filter((r) => r.health >= 80).length,
      deepDone,
      focusDone,
      sprintsDone: sprints.length,
      challengesDone: challenges.filter((c) => c.rewarded).length,
      underTenMinutes: underTen,
      earlyBird: early,
      nightOwl: night,
      perfectDays: [...perDay.values()].filter((n) => n >= 5).length,
    };
  }, [completions, tasks, coins, inventory, sprints, challenges, rooms, tick]);
}

/** Monday-to-Sunday week, the one Weekly Wrapped uses. */
export function useWrapped(weeksBack = 0) {
  const completions = useStore((s) => s.completions);
  const tasks = useStore((s) => s.tasks);
  const rooms = useStore((s) => s.rooms);

  return useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    const dow = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - dow - weeksBack * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 7);

    const inWeek = completions.filter((c) => {
      const t = new Date(c.at).getTime();
      return t >= monday.getTime() && t < sunday.getTime();
    });

    const byRoom = new Map<string, number>();
    const byDay = new Map<string, number>();
    let deep = 0;
    for (const c of inWeek) {
      byRoom.set(c.roomId, (byRoom.get(c.roomId) ?? 0) + 1);
      byDay.set(dayKey(c.at), (byDay.get(dayKey(c.at)) ?? 0) + 1);
      const t = tasks.find((x) => x.id === c.taskId);
      if (t?.effort === 'deep') deep++;
    }

    const topRoomId = [...byRoom.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const bestDayKey = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      monday,
      sunday: new Date(sunday.getTime() - 1),
      tasks: inWeek.length,
      minutes: Math.round(inWeek.reduce((s, c) => s + creditedMinutes(c, tasks), 0)),
      coins: inWeek.reduce((s, c) => s + c.coins, 0),
      deep,
      topRoom: rooms.find((r) => r.id === topRoomId) ?? null,
      topRoomCount: topRoomId ? (byRoom.get(topRoomId) ?? 0) : 0,
      bestDayKey: bestDayKey ?? null,
      bestDayCount: bestDayKey ? (byDay.get(bestDayKey) ?? 0) : 0,
      daysActive: byDay.size,
    };
  }, [completions, tasks, rooms, weeksBack]);
}
