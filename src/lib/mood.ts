import { addDays, dayKey } from './date';
import type { MoodEntry, MoodPreset } from './types';

/**
 * How you feel today, in four parts: your mood, how much you have for other
 * people, energy to clean, energy for things you enjoy. Each is 0-100. The
 * presets fill all four in one tap for days when sliding is too much.
 *
 * Nothing here judges. A low day is information, not a failure, and the app
 * answers it with kindness and less to do — never with more.
 */

export type Scales = Pick<MoodEntry, 'mood' | 'social' | 'clean' | 'hobby'>;

export const PRESETS: { id: MoodPreset; emoji: string; label: string; values: Scales }[] = [
  { id: 'great', emoji: '🌈', label: 'Great', values: { mood: 90, social: 80, clean: 80, hobby: 85 } },
  { id: 'okay', emoji: '🌤️', label: 'Okay', values: { mood: 65, social: 55, clean: 55, hobby: 60 } },
  { id: 'meh', emoji: '☁️', label: 'Meh', values: { mood: 45, social: 35, clean: 40, hobby: 40 } },
  { id: 'low', emoji: '🌧️', label: 'Low', values: { mood: 25, social: 20, clean: 20, hobby: 25 } },
  { id: 'rough', emoji: '🫧', label: 'Rough', values: { mood: 8, social: 5, clean: 5, hobby: 10 } },
];

export const SCALES: { key: keyof Scales; label: string; low: string; high: string; emoji: string }[] = [
  { key: 'mood', label: 'Mood', low: 'heavy', high: 'bright', emoji: '💗' },
  { key: 'social', label: 'Room for other people', low: 'none today', high: 'plenty', emoji: '🫂' },
  { key: 'clean', label: 'Energy to clean', low: 'empty', high: 'full', emoji: '🧽' },
  { key: 'hobby', label: 'Energy for hobbies', low: 'empty', high: 'full', emoji: '🎨' },
];

export function presetById(id?: MoodPreset) {
  return PRESETS.find((p) => p.id === id);
}

/** The preset closest to some slider values, for showing a face for them. */
export function nearestPreset(v: Scales) {
  const dist = (p: Scales) => Math.abs(p.mood - v.mood) * 2 + Math.abs(p.social - v.social) + Math.abs(p.clean - v.clean) + Math.abs(p.hobby - v.hobby);
  return [...PRESETS].sort((a, b) => dist(a.values) - dist(b.values))[0];
}

export const average = (v: Scales) => (v.mood + v.social + v.clean + v.hobby) / 4;

/** A day to be extra gentle with: a low mood, or very little left of everything. */
export function isHardDay(v: Scales & { preset?: MoodPreset }): boolean {
  return v.preset === 'rough' || v.preset === 'low' || v.mood <= 30 || average(v) <= 30;
}

const LINES = {
  any: [
    'You checked in. That already counts.',
    'A hard day is not a failure. It is just a hard day.',
    'You are allowed to do less today.',
    'Your worth is not measured in clean counters.',
    'Rest is part of looking after a home — and you live there too.',
    'You have gotten through every hard day so far.',
    'Be as kind to yourself as you would be to a friend today.',
    'Small is still something. Nothing is also okay.',
  ],
  mood: [
    'Feelings this heavy pass, even when it doesn’t feel like it.',
    'You don’t have to fix anything today. Just be here.',
    'It makes sense to feel this way. You are not too much.',
  ],
  social: [
    'It’s okay to cancel plans and protect your quiet.',
    'Needing space from people is not selfish. It’s care.',
  ],
  clean: [
    'The mess will wait. It isn’t going anywhere, and neither are you.',
    'A lived-in home is a home someone lives in. That’s you.',
  ],
  hobby: [
    'Not wanting to do anything is a signal, not a flaw.',
    'Lying down and listening to something counts as a hobby today.',
  ],
};

/** Three kind lines for a hard day, chosen for what's lowest and steady for the day. */
export function affirmationsFor(v: Scales, day = dayKey()): string[] {
  let seed = [...day].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const rand = () => ((seed = (seed * 1103515245 + 12345) >>> 0) % 1000) / 1000;
  const pick = (list: string[]) => list[Math.floor(rand() * list.length)];
  const lowest = (['mood', 'social', 'clean', 'hobby'] as const).reduce((a, b) => (v[b] < v[a] ? b : a));
  const out = new Set<string>([pick(LINES[lowest]), pick(LINES.any)]);
  while (out.size < 3) out.add(pick(LINES.any));
  return [...out];
}

export type Suggestion = 'rest' | 'tiny' | 'quiet' | 'cosy';

/** What might help, in the app's terms — always less, never more. */
export function suggestionsFor(v: Scales): Suggestion[] {
  const out: Suggestion[] = [];
  if (v.clean <= 30) out.push('rest');
  if (v.clean > 30 && v.clean <= 55) out.push('tiny');
  if (v.social <= 30) out.push('quiet');
  out.push('cosy');
  return out;
}

/* ---- data --------------------------------------------------------------- */

/** One check-in per day: the newest of each day. */
export function byDay(moods: MoodEntry[]): Map<string, MoodEntry> {
  const out = new Map<string, MoodEntry>();
  for (const m of [...moods].sort((a, b) => a.at.localeCompare(b.at))) out.set(m.day, m);
  return out;
}

/**
 * The GitHub-style grid: `weeks` columns of Monday-to-Sunday, ending with
 * this week. Days after today are null.
 */
export function heatmapGrid(weeks: number, today = new Date()): (string | null)[][] {
  const t = new Date(today);
  t.setHours(12, 0, 0, 0);
  const monday = addDays(t, -((t.getDay() + 6) % 7));
  const start = addDays(monday, -7 * (weeks - 1));
  const todayKey = dayKey(t);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const k = dayKey(addDays(start, w * 7 + d));
      return k > todayKey ? null : k;
    }),
  );
}
