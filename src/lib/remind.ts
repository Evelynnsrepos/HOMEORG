import { agoLabel, careState, daysLeft, SUPPLY_LOW_DAYS } from './pets';
import { daysBetween, dayKey } from './date';
import type { MyPet, PantryItem, PetCare, PetSupply } from './types';

/**
 * "Don't forget this": the handful of things worth a nudge today, from every
 * corner of the app — food to use up or throw out, a fridge running empty,
 * and (in pet mode) supplies running low and the cleaning jobs that are due.
 * Feeding and water live on the pet widget instead, so this never nags.
 */

export interface Reminder {
  id: string;
  emoji: string;
  text: string;
  detail: string;
  /** warm = do it today; soft = soon */
  tone: 'warm' | 'soft';
  route: '/pantry' | '/shopping' | '/pets';
  /** for sorting: lower first */
  urgency: number;
}

export const FRIDGE_FULL = 24;
const FRIDGE_LOW = 0.2;

export function reminders(input: {
  pantry: PantryItem[];
  petMode?: boolean;
  pets?: MyPet[];
  petLog?: PetCare[];
  supplies?: PetSupply[];
  now?: Date;
  soonDays?: number;
}): Reminder[] {
  const now = input.now ?? new Date();
  const today = dayKey(now);
  const out: Reminder[] = [];

  for (const p of input.pantry) {
    if (!p.bestBefore) continue;
    const left = daysBetween(today, p.bestBefore);
    if (left < 0) {
      out.push({
        id: `out-${p.id}`,
        emoji: '🗑️',
        text: `Throw out ${p.name}`,
        detail: `${-left}d over${p.place === 'fridge' ? ' · fridge' : ''}`,
        tone: 'warm',
        route: '/pantry',
        urgency: left,
      });
    } else if (left <= (input.soonDays ?? 4)) {
      out.push({
        id: `use-${p.id}`,
        emoji: '⏳',
        text: `Use up ${p.name}`,
        detail: left === 0 ? 'today' : left === 1 ? 'tomorrow' : `${left}d left`,
        tone: left <= 1 ? 'warm' : 'soft',
        route: '/pantry',
        urgency: left,
      });
    }
  }

  // only for kitchens in use: a brand-new install isn't told to go shopping
  const inFridge = input.pantry.filter((p) => p.place === 'fridge').length;
  if (input.pantry.length && inFridge / FRIDGE_FULL < FRIDGE_LOW) {
    out.push({
      id: 'fridge-low',
      emoji: '🧊',
      text: 'Restock the fridge',
      detail: inFridge ? `only ${inFridge} ${inFridge === 1 ? 'thing' : 'things'} inside` : "it's empty",
      tone: 'soft',
      route: '/shopping',
      urgency: 3,
    });
  }

  if (input.petMode) {
    for (const s of input.supplies ?? []) {
      const d = daysLeft(s, now);
      if (d == null || d > SUPPLY_LOW_DAYS) continue;
      out.push({
        id: `sup-${s.id}`,
        emoji: s.kind === 'litter' ? '🪣' : s.kind === 'hay' ? '🌿' : '🛍️',
        text: `Get more ${s.name}`,
        detail: d < 1 ? 'about out' : `~${Math.round(d)}d left`,
        tone: d < 2 ? 'warm' : 'soft',
        route: '/pets',
        urgency: d - 1,
      });
    }
    for (const pet of input.pets ?? []) {
      for (const st of careState(pet, input.petLog ?? [], now)) {
        // a job never logged isn't nagged about: a new pet shouldn't fill the list
        if (!st.action.chore || !st.due || !isFinite(st.since)) continue;
        const late = st.since / st.action.every;
        out.push({
          id: `care-${pet.id}-${st.action.id}`,
          emoji: st.action.emoji,
          text: `${st.action.label} for ${pet.name}`,
          detail: `last ${agoLabel(st.since)}`,
          tone: late >= 1.5 ? 'warm' : 'soft',
          route: '/pets',
          urgency: 2 - late,
        });
      }
    }
  }

  return out.sort((a, b) => Number(a.tone === 'soft') - Number(b.tone === 'soft') || a.urgency - b.urgency);
}

