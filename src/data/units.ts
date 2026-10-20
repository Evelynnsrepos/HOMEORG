/**
 * Measurements for the pantry. Deliberately short — the common ones for a
 * weekly shop, plus whatever you want to type yourself.
 */

export interface Unit {
  id: string;
  /** what you see on the chip */
  short: string;
  /** plural-safe long name for the item row */
  long: string;
  /** sensible step for the +/- buttons */
  step: number;
  group: 'weight' | 'volume' | 'count';
}

export const units: Unit[] = [
  { id: 'g', short: 'g', long: 'g', step: 50, group: 'weight' },
  { id: 'kg', short: 'kg', long: 'kg', step: 0.5, group: 'weight' },
  { id: 'ml', short: 'ml', long: 'ml', step: 100, group: 'volume' },
  { id: 'l', short: 'l', long: 'l', step: 0.5, group: 'volume' },
  { id: 'pc', short: 'pcs', long: 'pcs', step: 1, group: 'count' },
  { id: 'pack', short: 'packs', long: 'packs', step: 1, group: 'count' },
  { id: 'can', short: 'tins', long: 'tins', step: 1, group: 'count' },
  { id: 'jar', short: 'jars', long: 'jars', step: 1, group: 'count' },
  { id: 'bottle', short: 'bottles', long: 'bottles', step: 1, group: 'count' },
  { id: 'bunch', short: 'bunches', long: 'bunches', step: 1, group: 'count' },
  { id: 'bag', short: 'bags', long: 'bags', step: 1, group: 'count' },
  { id: 'tbsp', short: 'tbsp', long: 'tbsp', step: 1, group: 'volume' },
];

export function unitById(id: string): Unit | undefined {
  return units.find((u) => u.id === id);
}

/** What to show next to the number — a known unit, or your own wording. */
export function unitLabel(id: string): string {
  return unitById(id)?.long ?? id;
}

export function unitStep(id: string): number {
  return unitById(id)?.step ?? 1;
}

/** Trim trailing zeros so 1.5 kg reads as "1.5" and 2.0 as "2". */
export function formatQty(n: number): string {
  return Number.isInteger(n) ? `${n}` : `${Math.round(n * 100) / 100}`;
}

/** "1 bag", "2 bags", "250 g" — counted things lose the s when there's one. */
export function qtyLabel(qty: number, unit: string): string {
  const known = unitById(unit);
  let word = known?.long ?? unit;
  if (qty === 1 && word.length > 1 && word.endsWith('s')) word = word.slice(0, -1);
  if (unit === 'pc' && qty === 1) word = 'pc';
  return `${formatQty(qty)} ${word}`;
}

export type Place = 'fridge' | 'freezer' | 'pantry';

export const places: { id: Place; name: string; emoji: string; blurb: string }[] = [
  { id: 'fridge', name: 'Fridge', emoji: '\u{1F9CA}', blurb: 'Eat this first.' },
  { id: 'freezer', name: 'Freezer', emoji: '\u{2744}\u{FE0F}', blurb: 'Keeps for months.' },
  { id: 'pantry', name: 'Cupboard', emoji: '\u{1F96B}', blurb: 'Tins, pasta, the dry stuff.' },
];

/**
 * A first guess at where something belongs and how it is measured, so adding a
 * shopped item is one tap instead of three.
 */
const guesses: { match: RegExp; place: Place; unit: string }[] = [
  { match: /milk|cream|yoghurt|yogurt|butter|cheese|quark|skyr/i, place: 'fridge', unit: 'ml' },
  { match: /egg/i, place: 'fridge', unit: 'pc' },
  { match: /chicken|beef|pork|mince|bacon|ham|sausage|fish|salmon|tofu/i, place: 'fridge', unit: 'g' },
  { match: /salad|lettuce|spinach|herb|basil|parsley|coriander/i, place: 'fridge', unit: 'bunch' },
  { match: /pea|bean|berr|frozen|ice/i, place: 'freezer', unit: 'g' },
  { match: /rice|pasta|noodle|flour|sugar|oat|lentil|couscous|quinoa/i, place: 'pantry', unit: 'g' },
  { match: /tin|tinned|chickpea|tomato|coconut milk/i, place: 'pantry', unit: 'can' },
  { match: /oil|vinegar|sauce|juice|water|wine/i, place: 'pantry', unit: 'bottle' },
  { match: /bread|roll|wrap|tortilla/i, place: 'pantry', unit: 'pack' },
  { match: /onion|potato|carrot|garlic|apple|banana|lemon|pepper|courgette/i, place: 'pantry', unit: 'pc' },
];

export function guessFor(name: string): { place: Place; unit: string } {
  const hit = guesses.find((g) => g.match.test(name));
  return hit ? { place: hit.place, unit: hit.unit } : { place: 'pantry', unit: 'pc' };
}
