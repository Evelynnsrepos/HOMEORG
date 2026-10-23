import { pieces } from '../data/stickerCatalog';
import type { MyPet, PetCare, PetKind, PetSupply } from './types';

/**
 * Pet mode: your real pets, the little things you do for them every day, and
 * the supplies they go through. Care is a quick tap, never a chore list that
 * scolds — a due action just glows a little warmer.
 */

export interface CareAction {
  id: string;
  label: string;
  emoji: string;
  /** hours until it's worth doing again */
  every: number;
  /** a cleaning job: shows up in "Don't forget this" when it's due */
  chore?: boolean;
}

export const CARE: Record<PetKind, CareAction[]> = {
  cat: [
    { id: 'food', label: 'Food', emoji: '🍽️', every: 12 },
    { id: 'water', label: 'Water', emoji: '💧', every: 24 },
    { id: 'litter', label: 'Litter box', emoji: '🧹', every: 24, chore: true },
    { id: 'play', label: 'Play', emoji: '🧶', every: 24 },
  ],
  dog: [
    { id: 'food', label: 'Food', emoji: '🍽️', every: 12 },
    { id: 'water', label: 'Water', emoji: '💧', every: 24 },
    { id: 'walk', label: 'Walk', emoji: '🦮', every: 8 },
    { id: 'play', label: 'Play', emoji: '🎾', every: 24 },
  ],
  bird: [
    { id: 'food', label: 'Seeds', emoji: '🌾', every: 24 },
    { id: 'water', label: 'Water', emoji: '💧', every: 24 },
    { id: 'cage', label: 'Clean cage', emoji: '🧽', every: 24 * 7, chore: true },
    { id: 'fly', label: 'Free flight', emoji: '🪶', every: 24 },
  ],
  bunny: [
    { id: 'food', label: 'Hay & veg', emoji: '🥬', every: 12 },
    { id: 'water', label: 'Water', emoji: '💧', every: 24 },
    { id: 'hutch', label: 'Clean hutch', emoji: '🧹', every: 24 * 3, chore: true },
    { id: 'roam', label: 'Hop time', emoji: '🐾', every: 24 },
  ],
  small: [
    { id: 'food', label: 'Fresh food', emoji: '🥕', every: 24 },
    { id: 'water', label: 'Water', emoji: '💧', every: 24 },
    { id: 'spot', label: 'Spot clean', emoji: '🧹', every: 48, chore: true },
    { id: 'cage', label: 'Full clean', emoji: '🧽', every: 24 * 7, chore: true },
    { id: 'run', label: 'Run time', emoji: '🎡', every: 24 },
  ],
  fish: [
    { id: 'food', label: 'Feed', emoji: '🐟', every: 24 },
    { id: 'heater', label: 'Heater & light', emoji: '💡', every: 24 },
    { id: 'waterchange', label: 'Water change', emoji: '🪣', every: 24 * 7, chore: true },
    { id: 'filter', label: 'Glass & filter', emoji: '🧽', every: 24 * 14, chore: true },
  ],
  reptile: [
    { id: 'food', label: 'Food & bugs', emoji: '🦗', every: 48 },
    { id: 'mist', label: 'Water & mist', emoji: '💦', every: 24 },
    { id: 'heat', label: 'Heat lamp', emoji: '🔆', every: 24 },
    { id: 'tank', label: 'Clean tank', emoji: '🧽', every: 24 * 7, chore: true },
  ],
  other: [
    { id: 'food', label: 'Food', emoji: '🍽️', every: 24 },
    { id: 'water', label: 'Water', emoji: '💧', every: 24 },
    { id: 'clean', label: 'Clean home', emoji: '🧽', every: 24 * 7, chore: true },
  ],
};

export const PET_KINDS: { id: PetKind; label: string; emoji: string }[] = [
  { id: 'cat', label: 'Cat', emoji: '🐈' },
  { id: 'dog', label: 'Dog', emoji: '🐕' },
  { id: 'bird', label: 'Bird', emoji: '🐦' },
  { id: 'bunny', label: 'Bunny', emoji: '🐇' },
  { id: 'small', label: 'Hamster & co', emoji: '🐹' },
  { id: 'fish', label: 'Fish', emoji: '🐠' },
  { id: 'reptile', label: 'Reptile', emoji: '🦎' },
  { id: 'other', label: 'Other', emoji: '🐾' },
];

/** What kind of animal a pixel pet preset is, from its id. */
export function kindOfPreset(pieceId: string): PetKind {
  const p = pieces.find((x) => x.id === pieceId);
  if (!p || p.kind !== 'pet') return 'other';
  if (pieceId.startsWith('pet-dog-')) return 'dog';
  if (pieceId.startsWith('pet-bunny-')) return 'bunny';
  if (pieceId.startsWith('pet-fish-')) return 'fish';
  if (/^pet-(gecko|turtle|tortoise)/.test(pieceId)) return 'reptile';
  if (/^pet-(hamster|guinea|rat)-/.test(pieceId)) return 'small';
  if (p.set === 'feathers') return 'bird';
  return 'cat';
}

/** The pixel presets a pet of this kind can look like; every one is free for your own pet. */
export function presetsFor(kind: PetKind): string[] {
  return pieces.filter((p) => p.kind === 'pet' && (kind === 'other' || kindOfPreset(p.id) === kind)).map((p) => p.id);
}

export interface CareState {
  action: CareAction;
  last?: string;
  /** hours since last time, Infinity if never */
  since: number;
  due: boolean;
}

export function careState(pet: MyPet, log: PetCare[], now = new Date()): CareState[] {
  return CARE[pet.kind].map((action) => {
    const last = log
      .filter((c) => c.petId === pet.id && c.action === action.id)
      .reduce<string | undefined>((m, c) => (!m || c.at > m ? c.at : m), undefined);
    const since = last ? (now.getTime() - new Date(last).getTime()) / 3600000 : Infinity;
    return { action, last, since, due: since >= action.every };
  });
}

/** "just now", "3h ago", "2d ago", "not yet". */
export function agoLabel(hours: number): string {
  if (!isFinite(hours)) return 'not yet';
  if (hours < 1) return 'just now';
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Days a supply still lasts at its daily use, counted from when it was last updated. */
export function daysLeft(s: PetSupply, now = new Date()): number | null {
  if (!s.perDay || s.perDay <= 0) return null;
  const used = ((now.getTime() - new Date(s.updatedAt).getTime()) / 86400000) * s.perDay;
  return Math.max(0, (s.amount - used) / s.perDay);
}

export const SUPPLY_LOW_DAYS = 5;

/** A supply's amount right now, after what's been used since it was last updated. */
export function amountNow(s: PetSupply, now = new Date()): number {
  if (!s.perDay) return s.amount;
  return Math.max(0, s.amount - ((now.getTime() - new Date(s.updatedAt).getTime()) / 86400000) * s.perDay);
}
