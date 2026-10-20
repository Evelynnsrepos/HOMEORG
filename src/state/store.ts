import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { presetChallenges } from '../data/challenges';
import { roomTypeById } from '../data/roomTypes';
import { shopItems } from '../data/shop';
import { starterFor } from '../data/starterRooms';
import { unitStep as pantryStep, type Place } from '../data/units';
import { dayKey } from '../lib/date';
import { coinsForEffort, momentumBonus, taskCycleMs } from '../lib/engine';
import { inStock } from '../lib/kitchen';
import { sameThing } from '../lib/orderImport';
import { uid } from '../lib/id';
import type {
  Achievement,
  ChallengeProgress,
  Completion,
  CustomChallenge,
  Effort,
  LegacyMeal,
  LegacySavedMeal,
  PantryItem,
  PinnedNote,
  PlannedMeal,
  Recipe,
  RecipeExtra,
  Room,
  Settings,
  ShoppingItem,
  SprintRecord,
  Task,
} from '../lib/types';
import { roomPalette } from '../theme';

export const DECOR_SLOTS = 10;

const defaultSettings: Settings = {
  householdName: 'Your Sanctuary',
  homeType: 'flat',
  floors: ['Home'],
  dailyBudget: 30,
  preferredDays: [1, 2, 3, 4, 5],
  vacation: false,
  groupByRooms: true,
  sound: true,
  haptics: true,
  reminderHour: 9,
  reminderMinute: 0,
  reminderOn: false,
  lookupOnline: true,
  onboarded: false,
};

export interface NewRoomInput {
  typeId: string;
  name: string;
  emoji: string;
  floor: number;
  condition: number;
  chores: { name: string; minutes: number; effort: Effort; every: number; unit: Task['unit'] }[];
}

interface State {
  hydrated: boolean;
  settings: Settings;
  rooms: Room[];
  tasks: Task[];
  completions: Completion[];
  coins: number;
  inventory: string[];
  challenges: ChallengeProgress[];
  customChallenges: CustomChallenge[];
  recipes: Recipe[];
  /** dishes put on the next days */
  mealPlan: PlannedMeal[];
  shopping: ShoppingItem[];
  pantry: PantryItem[];
  /** shelf you moved something to, by lowercased name, so the next order gets it right */
  shelfMemory: Record<string, Place>;
  /** order numbers already put away, so the same PDF can't double the shelves */
  importedOrders: string[];
  notes: PinnedNote[];
  sprints: SprintRecord[];
  achievements: Achievement[];
  breakdownDay: string;
  breakdownUsed: number;
  vacationStartedAt: string | null;
  lastWheelTaskId: string | null;
}

interface Actions {
  setHydrated: () => void;
  patchSettings: (p: Partial<Settings>) => void;
  toggleVacation: () => void;

  createHome: (homeType: string, floors: string[], rooms: NewRoomInput[], name: string) => void;
  addRoom: (input: NewRoomInput) => string;
  updateRoom: (id: string, patch: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  reorderRooms: (ids: string[]) => void;

  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'lastDone'> & { lastDone?: string | null }) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (
    id: string,
    opts?: { minutes?: number | null; source?: Completion['source']; photoAfter?: string },
  ) => number;
  undoCompletion: (completionId: string) => void;
  deferTask: (id: string, day: string | null) => void;
  attachPhoto: (completionId: string, kind: 'before' | 'after', uri: string) => void;

  buyItem: (itemId: string) => boolean;
  placeDecor: (roomId: string, slot: number, itemId: string | null) => void;
  setSurface: (roomId: string, kind: 'wallpaper' | 'flooring', itemId: string) => void;

  joinChallenge: (id: string) => void;
  leaveChallenge: (id: string) => void;
  toggleChallengeItem: (challengeId: string, itemId: string) => void;
  createCustomChallenge: (ch: Omit<CustomChallenge, 'id' | 'createdAt'>) => string;
  deleteCustomChallenge: (id: string) => void;

  addRecipe: (name: string, ingredients: string[], extra?: RecipeExtra) => string | undefined;
  updateRecipe: (id: string, name: string, ingredients: string[], extra?: RecipeExtra) => void;
  removeRecipe: (id: string) => void;
  toggleWanted: (id: string) => void;
  cookRecipe: (id: string) => void;
  /** what is missing goes on the list, and the dish gets starred for the planner. Returns how many went on. */
  recipeToList: (id: string) => number;

  planMeal: (recipeId: string, day: string) => void;
  unplanMeal: (id: string) => void;

  addShopping: (name: string, qty?: number, from?: string) => void;
  toggleShopping: (id: string) => void;
  removeShopping: (id: string) => void;
  clearDoneShopping: () => void;

  addPantry: (item: Omit<PantryItem, 'id' | 'addedAt'>) => void;
  adjustPantry: (id: string, delta: number) => void;
  updatePantry: (id: string, patch: Partial<PantryItem>) => void;
  removePantry: (id: string) => void;
  useUpIngredients: (names: string[]) => void;
  rememberShelf: (name: string, place: Place) => void;
  /** a whole shop at once: onto the shelves, off the list. Returns how many list items it ticked. */
  putAway: (items: Omit<PantryItem, 'id' | 'addedAt'>[], orderNo?: string) => number;

  addNote: (title: string, body: string) => void;
  removeNote: (id: string) => void;

  recordSprint: (s: Omit<SprintRecord, 'id'>) => void;
  useBreakdown: () => boolean;
  setLastWheelTask: (id: string | null) => void;

  moveHouse: (homeType: string, floors: string[], rooms: NewRoomInput[]) => void;
  remodel: (homeType: string, floors: string[], assignment: Record<string, number>) => void;
  resetEverything: () => void;
}

export type Store = State & Actions;

const initialState: State = {
  hydrated: false,
  settings: defaultSettings,
  rooms: [],
  tasks: [],
  completions: [],
  coins: 0,
  inventory: [],
  challenges: [],
  customChallenges: [],
  recipes: [],
  mealPlan: [],
  shopping: [],
  pantry: [],
  shelfMemory: {},
  importedOrders: [],
  notes: [],
  sprints: [],
  achievements: [],
  breakdownDay: '',
  breakdownUsed: 0,
  vacationStartedAt: null,
  lastWheelTaskId: null,
};

/** Seed a task's anchor so a new room starts at the condition you picked. */
function seedLastDone(
  every: number,
  unit: Task['unit'],
  condition: number,
  now = new Date(),
): string {
  const probe: Task = {
    id: 'probe',
    roomId: '',
    name: '',
    minutes: 1,
    effort: 'light',
    kind: 'recurring',
    every,
    unit,
    createdAt: now.toISOString(),
    lastDone: now.toISOString(),
  };
  const cycle = taskCycleMs(probe, now);
  return new Date(now.getTime() - (1 - condition) * cycle).toISOString();
}

/**
 * A real "lived in" home isn't uniformly half dirty — some jobs are overdue and
 * some were done yesterday. Spread the starting point deterministically around
 * the condition the user picked, so Today has something on it from day one.
 */
function spread(condition: number, seedText: string): number {
  if (condition >= 1 || condition <= 0) return condition;
  let h = 0;
  for (let i = 0; i < seedText.length; i++) h = (h * 31 + seedText.charCodeAt(i)) % 1000;
  const jitter = (h / 1000 - 0.5) * 0.9;
  return Math.max(0, Math.min(1, condition + jitter));
}

/** Rooms don't all want the same wallpaper. */
const surfaceFor: Record<string, [string, string]> = {
  kitchen: ['wall_plaster', 'floor_tile'],
  living: ['wall_sage', 'floor_oak'],
  bathroom: ['wall_blush', 'floor_tile'],
  bedroom: ['wall_blush', 'floor_ash'],
  kids: ['wall_botanic', 'floor_ash'],
  dining: ['wall_clay', 'floor_herring'],
  office: ['wall_sage', 'floor_ash'],
  hallway: ['wall_clay', 'floor_herring'],
  laundry: ['wall_plaster', 'floor_tile'],
  guest: ['wall_botanic', 'floor_oak'],
  garage: ['wall_plaster', 'floor_slate'],
  storage: ['wall_plaster', 'floor_slate'],
  balcony: ['wall_botanic', 'floor_slate'],
  wc: ['wall_blush', 'floor_tile'],
};

/** Starter pieces are yours to keep, so you can move them between rooms. */
function withStarters(inventory: string[], rooms: Room[]): string[] {
  const out = new Set(inventory);
  for (const room of rooms) for (const id of room.decor ?? []) if (id) out.add(id);
  return [...out];
}

/**
 * The furniture catalogue changed between builds, so a saved home can hold ids
 * that no longer exist. Drop those, and if that empties a room out entirely,
 * hand it its starter set back rather than leaving it bare.
 */
function reconcileDecor(state: Store): Partial<Store> | null {
  if (!state.rooms?.length) return null;
  const known = new Set(shopItems.map((i) => i.id));
  let changed = false;

  const rooms = state.rooms.map((room) => {
    const decor: (string | null)[] = (
      room.decor ?? (Array(DECOR_SLOTS).fill(null) as (string | null)[])
    ).map((id) => (id && known.has(id) ? id : null));
    // A room left nearly bare by the catalogue change gets topped up from its
    // starter set. Anything you actually decorated (three pieces or more) is
    // left exactly as you arranged it.
    if (decor.filter(Boolean).length < 3) {
      for (const [slot, itemId] of Object.entries(starterFor(room.typeId))) {
        const i = Number(slot);
        if (decor[i] || decor.includes(itemId)) continue;
        decor[i] = itemId;
      }
    }
    if (decor.some((d, i) => d !== (room.decor ?? [])[i])) {
      changed = true;
      return { ...room, decor };
    }
    return room;
  });

  if (!changed) return null;
  return {
    rooms,
    inventory: withStarters(
      (state.inventory ?? []).filter((id) => known.has(id)),
      rooms,
    ),
  };
}

function buildRoom(input: NewRoomInput, order: number): { room: Room; tasks: Task[] } {
  const id = uid('room');
  const starter = starterFor(input.typeId);
  const decor: (string | null)[] = Array(DECOR_SLOTS).fill(null);
  for (const [slot, itemId] of Object.entries(starter)) decor[Number(slot)] = itemId;

  const [wallpaper, flooring] = surfaceFor[input.typeId] ?? ['wall_plaster', 'floor_oak'];

  const room: Room = {
    id,
    typeId: input.typeId,
    name: input.name,
    emoji: input.emoji,
    color: roomPalette[order % roomPalette.length],
    floor: input.floor,
    order,
    wallpaper,
    flooring,
    decor,
    createdAt: new Date().toISOString(),
  };
  const tasks: Task[] = input.chores.map((ch) => ({
    id: uid('task'),
    roomId: id,
    name: ch.name,
    minutes: ch.minutes,
    effort: ch.effort,
    kind: 'recurring' as const,
    every: ch.every,
    unit: ch.unit,
    lastDone: seedLastDone(ch.every, ch.unit, spread(input.condition, ch.name)),
    createdAt: new Date().toISOString(),
    deferredTo: null,
  }));
  return { room, tasks };
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      setHydrated: () => set({ hydrated: true }),

      patchSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

      toggleVacation: () =>
        set((s) => {
          if (!s.settings.vacation) {
            return {
              settings: { ...s.settings, vacation: true },
              vacationStartedAt: new Date().toISOString(),
            };
          }
          // Coming back: push every anchor forward so nothing decayed while away.
          const frozen = s.vacationStartedAt
            ? Date.now() - new Date(s.vacationStartedAt).getTime()
            : 0;
          return {
            settings: { ...s.settings, vacation: false },
            vacationStartedAt: null,
            tasks: s.tasks.map((t) =>
              t.lastDone
                ? { ...t, lastDone: new Date(new Date(t.lastDone).getTime() + frozen).toISOString() }
                : t,
            ),
          };
        }),

      createHome: (homeType, floors, rooms, name) =>
        set((s) => {
          const built = rooms.map((r, i) => buildRoom(r, i));
          const built_rooms = built.map((b) => b.room);
          return {
            settings: {
              ...defaultSettings,
              ...get().settings,
              homeType,
              floors,
              householdName: name || 'Your Sanctuary',
              onboarded: true,
            },
            rooms: built_rooms,
            tasks: built.flatMap((b) => b.tasks),
            inventory: withStarters(s.inventory, built_rooms),
          };
        }),

      addRoom: (input) => {
        const order = get().rooms.length;
        const { room, tasks } = buildRoom(input, order);
        set((s) => ({
          rooms: [...s.rooms, room],
          tasks: [...s.tasks, ...tasks],
          inventory: withStarters(s.inventory, [room]),
        }));
        return room.id;
      },

      updateRoom: (id, patch) =>
        set((s) => ({ rooms: s.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      deleteRoom: (id) =>
        set((s) => ({
          rooms: s.rooms.filter((r) => r.id !== id),
          tasks: s.tasks.filter((t) => t.roomId !== id),
          completions: s.completions.filter((c) => c.roomId !== id),
        })),

      reorderRooms: (ids) =>
        set((s) => ({
          rooms: s.rooms.map((r) => {
            const i = ids.indexOf(r.id);
            return i === -1 ? r : { ...r, order: i };
          }),
        })),

      addTask: (t) => {
        // `null` means "start it due", so a new chore turns up on Today at once
        const anchor =
          t.lastDone === null ? seedLastDone(t.every, t.unit, 0) : (t.lastDone ?? new Date().toISOString());
        const task: Task = {
          ...t,
          id: uid('task'),
          createdAt: new Date().toISOString(),
          lastDone: anchor,
          deferredTo: null,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return task.id;
      },

      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      deleteTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          completions: s.completions.filter((c) => c.taskId !== id),
        })),

      completeTask: (id, opts = {}) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === id);
        if (!task) return 0;
        const now = new Date();
        const base = coinsForEffort[task.effort];
        const bonus = momentumBonus(state.completions, now);
        const coins = base + bonus;
        const completion: Completion = {
          id: uid('done'),
          taskId: task.id,
          roomId: task.roomId,
          taskName: task.name,
          at: now.toISOString(),
          minutes: opts.minutes ?? null,
          source: opts.source ?? 'tick',
          coins,
          photoAfter: opts.photoAfter,
        };
        set((s) => ({
          completions: [completion, ...s.completions].slice(0, 4000),
          coins: s.coins + coins,
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  lastDone: now.toISOString(),
                  deferredTo: null,
                  doneOnce: t.kind === 'once' ? true : t.doneOnce,
                }
              : t,
          ),
        }));
        return coins;
      },

      undoCompletion: (completionId) =>
        set((s) => {
          const c = s.completions.find((x) => x.id === completionId);
          if (!c) return {};
          const rest = s.completions.filter((x) => x.id !== completionId);
          const previous = rest.find((x) => x.taskId === c.taskId);
          return {
            completions: rest,
            coins: Math.max(0, s.coins - c.coins),
            tasks: s.tasks.map((t) =>
              t.id === c.taskId
                ? {
                    ...t,
                    lastDone: previous ? previous.at : null,
                    doneOnce: t.kind === 'once' ? false : t.doneOnce,
                  }
                : t,
            ),
          };
        }),

      deferTask: (id, day) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, deferredTo: day } : t)),
        })),

      /**
       * Photos never leave the device. We keep the newest 50 and drop anything
       * older than 35 days, the same ceiling the hosted app uses.
       */
      attachPhoto: (completionId, kind, uri) =>
        set((s) => {
          const cutoff = Date.now() - 35 * 86_400_000;
          let kept = 0;
          const completions = s.completions.map((c) =>
            c.id === completionId
              ? { ...c, [kind === 'before' ? 'photoBefore' : 'photoAfter']: uri }
              : c,
          );
          return {
            completions: completions.map((c) => {
              if (!c.photoBefore && !c.photoAfter) return c;
              const tooOld = new Date(c.at).getTime() < cutoff;
              kept += 1;
              if (!tooOld && kept <= 50) return c;
              return { ...c, photoBefore: undefined, photoAfter: undefined };
            }),
          };
        }),

      buyItem: (itemId) => {
        const item = shopItems.find((i) => i.id === itemId);
        const s = get();
        if (!item || s.inventory.includes(itemId) || s.coins < item.price) return false;
        set({ coins: s.coins - item.price, inventory: [...s.inventory, itemId] });
        return true;
      },

      placeDecor: (roomId, slot, itemId) =>
        set((s) => ({
          rooms: s.rooms.map((r) => {
            if (r.id !== roomId) return r;
            const decor = [...(r.decor ?? Array(DECOR_SLOTS).fill(null))];
            // an item lives in one slot at a time
            if (itemId) {
              for (let i = 0; i < decor.length; i++) if (decor[i] === itemId) decor[i] = null;
            }
            decor[slot] = itemId;
            return { ...r, decor };
          }),
        })),

      setSurface: (roomId, kind, itemId) =>
        set((s) => ({
          rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, [kind]: itemId } : r)),
        })),

      joinChallenge: (id) =>
        set((s) =>
          s.challenges.some((c) => c.challengeId === id)
            ? {}
            : {
                challenges: [
                  ...s.challenges,
                  { challengeId: id, joinedAt: new Date().toISOString(), done: [] },
                ],
              },
        ),

      leaveChallenge: (id) =>
        set((s) => ({ challenges: s.challenges.filter((c) => c.challengeId !== id) })),

      toggleChallengeItem: (challengeId, itemId) =>
        set((s) => {
          const prog = s.challenges.find((c) => c.challengeId === challengeId);
          if (!prog) return {};
          const done = prog.done.includes(itemId)
            ? prog.done.filter((d) => d !== itemId)
            : [...prog.done, itemId];

          const preset = presetChallenges.find((p) => p.id === challengeId);
          const custom = s.customChallenges.find((p) => p.id === challengeId);
          const total = preset
            ? preset.items.length
            : custom
              ? custom.taskIds.length + custom.oneOffs.length
              : 0;
          const reward = preset ? preset.coins : Math.min(200, total * 5);
          const finished = total > 0 && done.length >= total;

          return {
            coins: finished && !prog.rewarded ? s.coins + reward : s.coins,
            challenges: s.challenges.map((c) =>
              c.challengeId === challengeId
                ? {
                    ...c,
                    done,
                    completedAt: finished ? (c.completedAt ?? new Date().toISOString()) : undefined,
                    rewarded: c.rewarded || finished,
                  }
                : c,
            ),
          };
        }),

      createCustomChallenge: (ch) => {
        const id = uid('cc');
        set((s) => ({
          customChallenges: [
            ...s.customChallenges,
            { ...ch, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      deleteCustomChallenge: (id) =>
        set((s) => ({
          customChallenges: s.customChallenges.filter((c) => c.id !== id),
          challenges: s.challenges.filter((c) => c.challengeId !== id),
        })),

      /** Writing down a dish you already have keeps one entry, the newer one. */
      addRecipe: (name, ingredients, extra = {}) => {
        const clean = name.trim();
        if (!clean) return undefined;
        const existing = get().recipes.find(
          (r) => r.name.trim().toLowerCase() === clean.toLowerCase(),
        );
        if (existing) {
          set((s) => ({
            recipes: s.recipes.map((r) =>
              r.id === existing.id ? { ...r, ...extra, name: clean, ingredients } : r,
            ),
          }));
          return existing.id;
        }
        const id = uid('rec');
        set((s) => ({
          recipes: [
            { id, name: clean, ingredients, ...extra, createdAt: new Date().toISOString() },
            ...s.recipes,
          ],
        }));
        return id;
      },

      /** Clearing the name is how you throw a recipe out from the edit form. */
      updateRecipe: (id, name, ingredients, extra = {}) => {
        const clean = name.trim();
        if (!clean) return get().removeRecipe(id);
        set((s) => ({
          recipes: s.recipes.map((r) =>
            r.id === id ? { ...r, ...extra, name: clean, ingredients } : r,
          ),
        }));
      },

      removeRecipe: (id) =>
        set((s) => ({
          recipes: s.recipes.filter((r) => r.id !== id),
          mealPlan: s.mealPlan.filter((m) => m.recipeId !== id),
        })),

      toggleWanted: (id) =>
        set((s) => ({
          recipes: s.recipes.map((r) => (r.id === id ? { ...r, wanted: !r.wanted } : r)),
        })),

      /**
       * Cooked it: the shelves come down a step and the recipe gets a date.
       * The plan for today (or a day already gone) is done with, too.
       */
      cookRecipe: (id) => {
        const recipe = get().recipes.find((r) => r.id === id);
        if (!recipe) return;
        get().useUpIngredients(recipe.ingredients);
        const today = dayKey();
        set((s) => ({
          recipes: s.recipes.map((r) =>
            r.id === id ? { ...r, lastCooked: new Date().toISOString() } : r,
          ),
          mealPlan: s.mealPlan.filter((m) => m.recipeId !== id || m.day > today),
        }));
      },

      recipeToList: (id) => {
        const recipe = get().recipes.find((r) => r.id === id);
        if (!recipe) return 0;
        const { pantry } = get();
        const missing = recipe.ingredients.filter((i) => !inStock(pantry, i));
        missing.forEach((i) => get().addShopping(i, 1, recipe.name));
        set((s) => ({
          recipes: s.recipes.map((r) => (r.id === id ? { ...r, wanted: true } : r)),
        }));
        return missing.length;
      },

      /** The same dish twice on one day is a slip of the thumb, not a plan. */
      planMeal: (recipeId, day) =>
        set((s) =>
          s.mealPlan.some((m) => m.recipeId === recipeId && m.day === day)
            ? {}
            : {
                mealPlan: [
                  ...s.mealPlan,
                  { id: uid('meal'), recipeId, day, createdAt: new Date().toISOString() },
                ],
              },
        ),

      unplanMeal: (id) => set((s) => ({ mealPlan: s.mealPlan.filter((m) => m.id !== id) })),

      addShopping: (name, qty = 1, from) =>
        set((s) => {
          const key = name.trim().toLowerCase();
          if (!key) return {};
          const existing = s.shopping.find((i) => i.name.trim().toLowerCase() === key && !i.done);
          if (existing) {
            return {
              shopping: s.shopping.map((i) =>
                i.id === existing.id ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return {
            shopping: [...s.shopping, { id: uid('shop'), name: name.trim(), qty, done: false, from }],
          };
        }),

      toggleShopping: (id) =>
        set((s) => ({
          shopping: s.shopping.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
        })),

      removeShopping: (id) => set((s) => ({ shopping: s.shopping.filter((i) => i.id !== id) })),

      clearDoneShopping: () => set((s) => ({ shopping: s.shopping.filter((i) => !i.done) })),

      /** Same thing, same unit, same shelf? Top it up rather than duplicate it. */
      addPantry: (item) =>
        set((s) => {
          const key = item.name.trim().toLowerCase();
          if (!key) return {};
          const same = s.pantry.find(
            (p) =>
              p.name.trim().toLowerCase() === key && p.unit === item.unit && p.place === item.place,
          );
          if (same) {
            return {
              pantry: s.pantry.map((p) =>
                p.id === same.id
                  ? { ...p, qty: p.qty + item.qty, bestBefore: item.bestBefore ?? p.bestBefore }
                  : p,
              ),
            };
          }
          return {
            pantry: [
              { ...item, name: item.name.trim(), id: uid('pan'), addedAt: new Date().toISOString() },
              ...s.pantry,
            ],
          };
        }),

      adjustPantry: (id, delta) =>
        set((s) => ({
          pantry: s.pantry.flatMap((p) => {
            if (p.id !== id) return [p];
            const qty = Math.round((p.qty + delta) * 100) / 100;
            // hitting zero means it's gone, which is the whole point
            return qty > 0 ? [{ ...p, qty }] : [];
          }),
        })),

      updatePantry: (id, patch) =>
        set((s) => ({ pantry: s.pantry.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      removePantry: (id) => set((s) => ({ pantry: s.pantry.filter((p) => p.id !== id) })),

      rememberShelf: (name, place) =>
        set((s) => {
          const key = name.trim().toLowerCase();
          if (!key || s.shelfMemory[key] === place) return {};
          return { shelfMemory: { ...s.shelfMemory, [key]: place } };
        }),

      putAway: (items, orderNo) => {
        for (const item of items) get().addPantry(item);
        let ticked = 0;
        set((s) => ({
          shopping: s.shopping.map((i) => {
            if (i.done || !items.some((it) => sameThing(i.name, it.name))) return i;
            ticked++;
            return { ...i, done: true };
          }),
          importedOrders:
            orderNo && !s.importedOrders.includes(orderNo)
              ? [...s.importedOrders, orderNo].slice(-50)
              : s.importedOrders,
        }));
        return ticked;
      },

      /** Cooked a meal: knock one step off everything it used. */
      useUpIngredients: (names) =>
        set((s) => {
          const wanted = names.map((n) => n.trim().toLowerCase()).filter(Boolean);
          if (!wanted.length) return {};
          return {
            pantry: s.pantry.flatMap((p) => {
              const name = p.name.trim().toLowerCase();
              const hit = wanted.some((w) => name.includes(w) || w.includes(name));
              if (!hit) return [p];
              const qty = Math.round((p.qty - pantryStep(p.unit)) * 100) / 100;
              return qty > 0 ? [{ ...p, qty }] : [];
            }),
          };
        }),

      addNote: (title, body) =>
        set((s) => ({
          notes: [
            { id: uid('note'), title, body, createdAt: new Date().toISOString() },
            ...s.notes,
          ],
        })),

      removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      recordSprint: (sp) => set((s) => ({ sprints: [{ ...sp, id: uid('sprint') }, ...s.sprints] })),

      useBreakdown: () => {
        const s = get();
        const today = dayKey();
        const used = s.breakdownDay === today ? s.breakdownUsed : 0;
        if (used >= 50) return false;
        set({ breakdownDay: today, breakdownUsed: used + 1 });
        return true;
      },

      setLastWheelTask: (id) => set({ lastWheelTaskId: id }),

      moveHouse: (homeType, floors, rooms) =>
        set((s) => {
          const built = rooms.map((r, i) => buildRoom(r, i));
          const built_rooms = built.map((b) => b.room);
          return {
            settings: { ...s.settings, homeType, floors },
            rooms: built_rooms,
            tasks: built.flatMap((b) => b.tasks),
            completions: [],
            inventory: withStarters(s.inventory, built_rooms),
          };
        }),

      remodel: (homeType, floors, assignment) =>
        set((s) => ({
          settings: { ...s.settings, homeType, floors },
          rooms: s.rooms.map((r) => ({ ...r, floor: assignment[r.id] ?? 0 })),
        })),

      resetEverything: () => set({ ...initialState, hydrated: true }),
    }),
    {
      name: 'tidywell-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      /**
       * v1 kept a seven-day plan (meals) next to a list of favourites
       * (savedMeals) — the same dishes written down twice. They fold into one
       * pool of recipes: no day, no slot, just what you know how to cook.
       */
      migrate: (persisted, from) => {
        const s = (persisted ?? {}) as Record<string, unknown>;
        if (from >= 2) return s as unknown as Store;

        const old = [
          ...((s.savedMeals as LegacySavedMeal[] | undefined) ?? []),
          ...((s.meals as LegacyMeal[] | undefined) ?? []),
        ];
        const byName = new Map<string, Recipe>();
        for (const m of old) {
          const name = (m?.name ?? '').trim();
          if (!name) continue;
          const ingredients = Array.isArray(m.ingredients) ? m.ingredients : [];
          const seen = byName.get(name.toLowerCase());
          if (seen) {
            // the same dish planned on two days: keep what either copy knew
            const have = new Set(seen.ingredients.map((i) => i.toLowerCase()));
            seen.ingredients.push(...ingredients.filter((i) => !have.has(i.toLowerCase())));
          } else {
            byName.set(name.toLowerCase(), {
              id: uid('rec'),
              name,
              ingredients: [...ingredients],
              createdAt: new Date().toISOString(),
            });
          }
        }

        delete s.meals;
        delete s.savedMeals;
        return { ...s, recipes: [...byName.values()] } as unknown as Store;
      },
      partialize: ({ hydrated, ...rest }) => rest as Store,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const fixed = reconcileDecor(state);
        if (fixed) useStore.setState(fixed);
        state.setHydrated();
      },
    },
  ),
);

// Handy in the dev console when you want to poke at the state directly.
if (__DEV__) (globalThis as unknown as Record<string, unknown>).tidywell = useStore;

/** Small convenience for screens that only need one room. */
export function useRoom(id?: string) {
  return useStore((s) => s.rooms.find((r) => r.id === id));
}

export function roomTypeChores(typeId: string) {
  return roomTypeById(typeId).chores;
}
