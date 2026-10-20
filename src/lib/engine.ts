import { addInterval, cycleMs, dayKey, fromDayKey, startOfDay } from './date';
import type { Completion, Effort, Room, Settings, Task } from './types';

/* ------------------------------------------------------------------ *
 * Effort
 * ------------------------------------------------------------------ */

export const effortLabel: Record<Effort, string> = {
  light: 'Light',
  medium: 'Medium',
  deep: 'Deep',
};

export const coinsForEffort: Record<Effort, number> = { light: 3, medium: 5, deep: 10 };

/** Lighter work is nudged up the queue — momentum beats willpower. */
const easeFactor: Record<Effort, number> = { light: 1.6, medium: 1, deep: 0.6 };

/** Being very late stops earning you more priority past this point. */
const OVERDUE_CAP = 2.5;

/** A task only reaches Today once this much of its cycle has elapsed. */
export const DUE_THRESHOLD = 0.7;

/* ------------------------------------------------------------------ *
 * Cleanliness
 * ------------------------------------------------------------------ */

export function taskAnchor(task: Task): Date {
  return new Date(task.lastDone ?? task.createdAt);
}

/** Milliseconds in one full cleaning cycle, calendar aware. */
export function taskCycleMs(task: Task, from = taskAnchor(task)): number {
  if (task.kind !== 'recurring') return cycleMs(from, 1, 'week');
  return Math.max(1, cycleMs(from, task.every, task.unit));
}

/** 0 = a full cycle has passed, 1 = just cleaned. Clamped both ends. */
export function elapsedRatio(task: Task, now: Date = new Date()): number {
  const anchor = taskAnchor(task);
  const cycle = taskCycleMs(task, anchor);
  return Math.max(0, (now.getTime() - anchor.getTime()) / cycle);
}

/** The percentage you see. Never negative, never over 100. */
export function cleanliness(task: Task, now: Date = new Date()): number {
  if (task.kind === 'whenever') return task.lastDone ? 100 : 50;
  if (task.kind === 'once') {
    if (task.doneOnce) return 100;
    if (!task.dueDate) return 50;
    const due = fromDayKey(task.dueDate).getTime();
    const created = new Date(task.createdAt).getTime();
    const span = Math.max(1, due - created);
    return clampPct(100 * (1 - (now.getTime() - created) / span));
  }
  return clampPct(100 * (1 - elapsedRatio(task, now)));
}

const clampPct = (n: number) => Math.max(0, Math.min(100, n));

/** Next date this task falls due. */
export function dueDateOf(task: Task): Date {
  if (task.kind === 'once') return task.dueDate ? fromDayKey(task.dueDate) : new Date();
  const anchor = taskAnchor(task);
  return addInterval(anchor, task.every, task.unit);
}

/**
 * How overdue, tilted toward easy wins. Never surfaced in the UI —
 * it only decides the order of the list.
 */
export function priority(task: Task, now: Date = new Date()): number {
  if (task.kind === 'whenever') return 0;
  if (task.kind === 'once') {
    if (task.doneOnce) return 0;
    const days = task.dueDate
      ? (now.getTime() - fromDayKey(task.dueDate).getTime()) / 86_400_000
      : 0;
    return 1000 + days;
  }
  const r = Math.min(elapsedRatio(task, now), OVERDUE_CAP);
  return Math.pow(r, 1.15) * easeFactor[task.effort];
}

/**
 * Room health: an average of every task weighted by estimated minutes, so the
 * heavy jobs dominate the way they do in a real room.
 */
export function roomHealth(tasks: Task[], now: Date = new Date()): number {
  const live = tasks.filter((t) => t.kind === 'recurring');
  if (!live.length) return 100;
  let weighted = 0;
  let weight = 0;
  for (const t of live) {
    const w = Math.max(1, t.minutes);
    weighted += cleanliness(t, now) * w;
    weight += w;
  }
  return Math.floor(weighted / weight);
}

export function overallHealth(tasks: Task[], now: Date = new Date()): number {
  return roomHealth(tasks, now);
}

/* ------------------------------------------------------------------ *
 * The daily budget
 * ------------------------------------------------------------------ */

export function budgetForDay(settings: Settings, date: Date): number {
  const prefs = settings.preferredDays ?? [];
  if (!prefs.length) return settings.dailyBudget;
  return prefs.includes(date.getDay())
    ? settings.dailyBudget
    : Math.max(5, Math.round(settings.dailyBudget / 2));
}

export interface DayPlan {
  key: string;
  date: Date;
  budget: number;
  /** in-budget list, one-offs first */
  tasks: Task[];
  /** didn't fit — the "Got more time?" drawer */
  overflow: Task[];
  minutes: number;
}

interface PlanState {
  /** taskId -> simulated lastDone ISO */
  lastDone: Record<string, string>;
  doneOnce: Record<string, boolean>;
}

function withState(task: Task, state: PlanState): Task {
  const ld = state.lastDone[task.id];
  const done = state.doneOnce[task.id];
  if (!ld && !done) return task;
  return { ...task, lastDone: ld ?? task.lastDone, doneOnce: done ?? task.doneOnce };
}

/** Plan a single day from a (possibly simulated) task state. */
function planDay(
  allTasks: Task[],
  settings: Settings,
  date: Date,
  state: PlanState,
  isToday: boolean,
  doneIds: Set<string>,
): DayPlan {
  const key = dayKey(date);
  const at = isToday ? new Date() : startOfDay(date);
  const budget = budgetForDay(settings, date);

  const tasks = allTasks.map((t) => withState(t, state));

  // Anything already ticked off today stays on the list, crossed out, and its
  // minutes still count against the cap — finishing your day should end it.
  const doneToday = isToday ? tasks.filter((t) => doneIds.has(t.id)) : [];

  const oneOffs = tasks.filter(
    (t) => t.kind === 'once' && !t.doneOnce && t.dueDate && t.dueDate <= key,
  );

  const pinned = tasks.filter(
    (t) => t.kind === 'recurring' && t.deferredTo === key && !doneIds.has(t.id),
  );

  const candidates = tasks
    .filter(
      (t) =>
        t.kind === 'recurring' &&
        !doneIds.has(t.id) &&
        !pinned.some((p) => p.id === t.id) &&
        (t.deferredTo == null || t.deferredTo <= key) &&
        elapsedRatio(t, at) >= DUE_THRESHOLD,
    )
    .sort((a, b) => priority(b, at) - priority(a, at));

  const picked: Task[] = [...pinned];
  let minutes = doneToday.reduce((s, t) => s + t.minutes, 0);
  minutes += pinned.reduce((s, t) => s + t.minutes, 0);
  const overflow: Task[] = [];

  for (const t of candidates) {
    if (overflow.length === 0 && minutes + t.minutes <= budget) {
      picked.push(t);
      minutes += t.minutes;
    } else {
      overflow.push(t);
    }
  }

  // Safety net: never show an empty Today while there's a backlog.
  if (!picked.length && !oneOffs.length && !doneToday.length && overflow.length) {
    picked.push(overflow.shift()!);
    minutes += picked[0].minutes;
  }

  return {
    key,
    date,
    budget,
    tasks: [...oneOffs, ...picked, ...doneToday],
    overflow,
    minutes: minutes + oneOffs.reduce((s, t) => s + t.minutes, 0),
  };
}

/**
 * Today plus a projection of the days ahead. Future days assume you actually
 * did the days before them — that's what makes the week strip meaningful.
 */
export function planWeek(
  allTasks: Task[],
  settings: Settings,
  days = 7,
  doneTodayIds: Set<string> = new Set(),
  from: Date = new Date(),
): DayPlan[] {
  const state: PlanState = { lastDone: {}, doneOnce: {} };
  const out: DayPlan[] = [];
  for (let i = 0; i < days; i++) {
    const date = startOfDay(from);
    date.setDate(date.getDate() + i);
    const plan = planDay(allTasks, settings, date, state, i === 0, doneTodayIds);
    out.push(plan);
    // simulate the day being done, so tomorrow doesn't repeat it
    const done = i === 0 ? [] : plan.tasks;
    for (const t of done) {
      if (t.kind === 'once') state.doneOnce[t.id] = true;
      else state.lastDone[t.id] = new Date(date.getTime() + 10 * 3600_000).toISOString();
    }
  }
  return out;
}

export function planToday(
  allTasks: Task[],
  settings: Settings,
  doneTodayIds?: Set<string>,
): DayPlan {
  return planWeek(allTasks, settings, 1, doneTodayIds)[0];
}

/* ------------------------------------------------------------------ *
 * Streaks and coins
 * ------------------------------------------------------------------ */

export function streakDays(completions: Completion[], now = new Date()): number {
  if (!completions.length) return 0;
  const keys = new Set(completions.map((c) => dayKey(c.at)));
  const cursor = startOfDay(now);
  if (!keys.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (keys.has(dayKey(cursor))) {
    n++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

export function longestStreak(completions: Completion[]): number {
  const keys = [...new Set(completions.map((c) => dayKey(c.at)))].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const d = fromDayKey(k);
    if (prev && Math.round((d.getTime() - prev.getTime()) / 86_400_000) === 1) run++;
    else run = 1;
    prev = d;
    best = Math.max(best, run);
  }
  return best;
}

/** +2 for a second task inside ten minutes, +5 from the third onwards. */
export function momentumBonus(completions: Completion[], now = new Date()): number {
  const recent = completions.filter((c) => now.getTime() - new Date(c.at).getTime() < 600_000);
  if (recent.length === 0) return 0;
  if (recent.length === 1) return 2;
  return 5;
}

/** Minutes credited: a real recorded time if there is one, else the estimate. */
export function creditedMinutes(c: Completion, tasks: Task[]): number {
  if (c.minutes != null) return c.minutes;
  const t = tasks.find((x) => x.id === c.taskId);
  return t ? t.minutes : 0;
}

export function roomsWithHealth(rooms: Room[], tasks: Task[], now = new Date()) {
  return rooms
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((room) => {
      const own = tasks.filter((t) => t.roomId === room.id);
      return { room, tasks: own, health: roomHealth(own, now) };
    });
}
