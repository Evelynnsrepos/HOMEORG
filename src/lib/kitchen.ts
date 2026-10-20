import { addDays, daysBetween, dayKey } from './date';
import type { PantryItem, Recipe, RecipeEffort } from './types';

/** Loose match, because "2 onions" and "onion" are the same thing to a cook. */
export function inStock(pantry: PantryItem[], ingredient: string): PantryItem | undefined {
  const b = ingredient.trim().toLowerCase();
  if (!b) return undefined;
  return pantry.find((p) => {
    const a = p.name.trim().toLowerCase();
    return a === b || a.includes(b) || b.includes(a);
  });
}

/** A recipe with the pantry held up against it. */
export interface Matched {
  recipe: Recipe;
  parts: { name: string; have?: PantryItem }[];
  missing: string[];
}

export function matchRecipe(recipe: Recipe, pantry: PantryItem[]): Matched {
  const parts = recipe.ingredients.map((name) => ({ name, have: inStock(pantry, name) }));
  return { recipe, parts, missing: parts.filter((p) => !p.have).map((p) => p.name) };
}

/** Starred first, then what the kitchen can supply, then what you have not made in a while. */
export function matchRecipes(recipes: Recipe[], pantry: PantryItem[]): Matched[] {
  return recipes
    .map((r) => matchRecipe(r, pantry))
    .sort((a, b) => {
      if (!!a.recipe.wanted !== !!b.recipe.wanted) return a.recipe.wanted ? -1 : 1;
      if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
      return (a.recipe.lastCooked ?? '').localeCompare(b.recipe.lastCooked ?? '');
    });
}

/**
 * The dishes you could start right now: everything on the shelves. A recipe
 * with no ingredients written down proves nothing, so it does not count.
 */
export function cookableNow(recipes: Recipe[], pantry: PantryItem[]): Matched[] {
  if (!pantry.length) return [];
  return matchRecipes(recipes, pantry).filter(
    (m) => m.recipe.ingredients.length && !m.missing.length,
  );
}

/** Anything gone off or going off inside `days` days, soonest first. */
export function expiringSoon(pantry: PantryItem[], days = 3): PantryItem[] {
  const today = dayKey();
  return pantry
    .filter((p) => p.bestBefore && daysBetween(today, p.bestBefore) <= days)
    .sort((a, b) => (a.bestBefore ?? '').localeCompare(b.bestBefore ?? ''));
}

/** "3d left", "today", "2d over". */
export function shelfLifeLabel(bestBefore: string): string {
  const left = daysBetween(dayKey(), bestBefore);
  if (left < 0) return `${Math.abs(left)}d over`;
  if (left === 0) return 'today';
  if (left === 1) return 'tomorrow';
  return `${left}d left`;
}

export function cookTimeLabel(min?: number): string | null {
  if (!min || min <= 0) return null;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export const effortLabel: Record<RecipeEffort, string> = {
  1: 'Quick and easy',
  2: 'Some work',
  3: 'A project',
};

/** Today and the days after it, as day keys. */
export function nextDays(n = 7): string[] {
  const start = new Date();
  return Array.from({ length: n }, (_, i) => dayKey(addDays(start, i)));
}
