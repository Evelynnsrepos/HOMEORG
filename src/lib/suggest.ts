import { presetChallenges, type PresetChallenge } from '../data/challenges';
import type { ChallengeProgress, CustomChallenge, Room } from './types';

export interface ChallengePick {
  id: string;
  name: string;
  emoji: string;
  color: string;
  blurb: string;
  total: number;
  done: number;
  running: boolean;
}

/** Words that give a challenge item away as belonging to a kind of room. */
const roomWords: Record<string, string[]> = {
  kitchen: ['kitchen', 'fridge', 'oven', 'cupboard', 'hob', 'kettle', 'sink', 'dishes', 'bin'],
  dining: ['table', 'dining', 'chairs'],
  living: ['sofa', 'living', 'cushion', 'throw', 'tv', 'shelves'],
  bathroom: ['bath', 'shower', 'toilet', 'tiles', 'towel', 'sink', 'mirror'],
  wc: ['toilet', 'sink', 'mirror'],
  bedroom: ['bed', 'wardrobe', 'mattress', 'bedding', 'pillow'],
  guest: ['bed', 'bedding', 'guest'],
  kids: ['toys', 'kids', 'bedding'],
  office: ['desk', 'paper', 'cables', 'office'],
  hallway: ['shoe', 'hall', 'door', 'coats', 'mat'],
  laundry: ['wash', 'laundry', 'machine', 'iron'],
  balcony: ['balcony', 'plants', 'doorstep', 'outside'],
  garage: ['garage', 'tools', 'bike'],
  storage: ['storage', 'boxes', 'donation', 'sort'],
};

/**
 * Either the challenge you are in the middle of, or one that fits the rooms
 * needing the most love right now. `rooms` should come sorted dirtiest first.
 */
export function pickChallenge(
  rooms: Room[],
  progress: ChallengeProgress[],
  custom: CustomChallenge[],
): ChallengePick | null {
  for (const run of progress.filter((p) => !p.completedAt)) {
    const preset = presetChallenges.find((c) => c.id === run.challengeId);
    if (preset) {
      const { id, name, emoji, color, blurb, items } = preset;
      return { id, name, emoji, color, blurb, total: items.length, done: run.done.length, running: true };
    }
    const mine = custom.find((c) => c.id === run.challengeId);
    if (mine) {
      const total = mine.taskIds.length + mine.oneOffs.length;
      const { id, name, emoji, color } = mine;
      return { id, name, emoji, color, blurb: `${total} items you picked`, total, done: run.done.length, running: true };
    }
  }

  const finished = new Set(progress.map((p) => p.challengeId));
  const words = rooms.slice(0, 2).flatMap((r) => roomWords[r.typeId] ?? [r.name.toLowerCase()]);
  const open = presetChallenges.filter((c) => !finished.has(c.id));
  if (!open.length) return null;

  const score = (c: PresetChallenge) =>
    c.items.filter((it) => words.some((w) => it.toLowerCase().includes(w))).length / c.items.length;
  const best = [...open].sort((a, b) => score(b) - score(a))[0];
  const { id, name, emoji, color, blurb, items } = best;
  return { id, name, emoji, color, blurb, total: items.length, done: 0, running: false };
}
