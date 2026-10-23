import type { Unit } from './date';

export type Effort = 'light' | 'medium' | 'deep';
export type TaskKind = 'recurring' | 'once' | 'whenever';
export type CompletionSource = 'tick' | 'focus' | 'sprint' | 'wheel' | 'challenge';

export interface Task {
  id: string;
  roomId: string;
  name: string;
  minutes: number;
  effort: Effort;
  kind: TaskKind;
  every: number;
  unit: Unit;
  /** one-time tasks only, day key */
  dueDate?: string;
  /** ISO timestamp of the last completion */
  lastDone?: string | null;
  /** manual nudge: day key this task was dragged to */
  deferredTo?: string | null;
  doneOnce?: boolean;
  notes?: string;
  createdAt: string;
}

export interface Room {
  id: string;
  /** which preset it came from, so the canvas knows what to build in */
  typeId: string;
  name: string;
  emoji: string;
  color: string;
  floor: number;
  order: number;
  wallpaper: string;
  flooring: string;
  /** the old slot layout (index 0-9 -> shop item id); kept only to move it over to stickers */
  decor: (string | null)[];
  /** what's in the room now: stickers, anywhere, any size and angle */
  stickers?: PlacedSticker[];
  createdAt: string;
}

/** One sticker in a room. See src/lib/stickers.ts. */
export interface PlacedSticker {
  id: string;
  /** a sticker library id ("lounge-042") or an original drawn piece ("svg:sofa_sage") */
  piece: string;
  /** centre, as a fraction of the room picture; a little outside hangs off the edge */
  x: number;
  y: number;
  /** width as a fraction of the room's width */
  size: number;
  /** degrees, clockwise */
  rot: number;
  flip?: boolean;
  /** higher is in front */
  z: number;
}

export type MoodPreset = 'great' | 'okay' | 'meh' | 'low' | 'rough';

/** One check-in: how you feel, 0-100 on each scale. The newest one of a day is the day's. */
export interface MoodEntry {
  id: string;
  /** day key */
  day: string;
  at: string;
  preset?: MoodPreset;
  mood: number;
  /** capacity for other people */
  social: number;
  /** energy to clean */
  clean: number;
  /** energy for hobbies */
  hobby: number;
  note?: string;
}

export interface Completion {
  id: string;
  taskId: string;
  roomId: string;
  taskName: string;
  at: string;
  /** real recorded minutes, or null to fall back to the task estimate */
  minutes: number | null;
  source: CompletionSource;
  coins: number;
  photoBefore?: string;
  photoAfter?: string;
}

export interface Settings {
  householdName: string;
  homeType: string;
  floors: string[];
  dailyBudget: number;
  preferredDays: number[];
  vacation: boolean;
  groupByRooms: boolean;
  sound: boolean;
  haptics: boolean;
  reminderHour: number;
  reminderMinute: number;
  reminderOn: boolean;
  /** allow the one outbound call the app makes: barcode lookup */
  lookupOnline: boolean;
  onboarded: boolean;
  /** "Let's cook it" groups the picks by weekday. Off: one shortlist. */
  cookByDay?: boolean;
  /** colour scheme id from src/theme.ts; missing means the default */
  theme?: string;
  /** streak rhythm: show up at least every N days (1, 2, 3 or 7) */
  streakEvery?: number;
  /** extra days before a streak breaks */
  streakGrace?: number;
  /** active days that make a week count for the week streak */
  weekGoal?: number;
  /** vines and fairy lights; missing means whatever the scheme does */
  showVines?: boolean;
  /** stickers on cards; missing means whatever the scheme does */
  showStickers?: boolean;
  /** faint pixel colour splashes behind the screens; missing means whatever the scheme does */
  showSplashes?: boolean;
  /** pet mode: the pets widget on Home, pet care and supplies */
  petMode?: boolean;
}

export interface ChallengeProgress {
  challengeId: string;
  joinedAt: string;
  /** ids of ticked items — task ids for room tasks, `oneoff:i` for extras */
  done: string[];
  completedAt?: string;
  rewarded?: boolean;
}

export interface CustomChallenge {
  id: string;
  name: string;
  emoji: string;
  color: string;
  days: 3 | 7 | 14 | 30;
  taskIds: string[];
  oneOffs: string[];
  createdAt: string;
}

/**
 * Something you know how to cook. Deliberately not tied to a day: the point is
 * the pool — "this is what I could make" — and the pantry decides what is
 * actually doable right now.
 */
export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  /** starred, meaning you fancy this one soon */
  wanted?: boolean;
  /** ISO, stamped by "Cooked it". Only sorts the list and prints a small note. */
  lastCooked?: string;
  /** how you make it, free text, one step per line */
  steps?: string;
  /** or where it lives online, when the steps are somebody else's */
  link?: string;
  /** rough time from start to plate */
  minutes?: number;
  /** 1 quick and easy, 2 some work, 3 a project */
  effort?: RecipeEffort;
  createdAt: string;
}

export type RecipeEffort = 1 | 2 | 3;

/** The bits of a recipe besides its name and what goes in it. */
export type RecipeExtra = Pick<Recipe, 'steps' | 'link' | 'minutes' | 'effort'>;

/**
 * One dish picked in "Let's cook it". A day is optional: most picks are just
 * "soon", and only people who plan by weekday give them one.
 */
export interface PlannedMeal {
  id: string;
  recipeId: string;
  /** day key, when the pick is meant for a particular day */
  day?: string;
  createdAt: string;
}

/** Every time "Cooked it" was pressed, so History can count what you made. */
export interface CookedMeal {
  id: string;
  recipeId: string;
  /** the name then, in case the recipe is thrown out later */
  name: string;
  at: string;
}

/**
 * The old seven-day plan and the favourites list beside it. Nothing reads these
 * any more except the one-time migration in state/store.ts, which folds both
 * into Recipe.
 */
export interface LegacyMeal {
  id: string;
  day: string;
  slot: number;
  name: string;
  ingredients: string[];
  pinned?: boolean;
}

export interface LegacySavedMeal {
  id: string;
  name: string;
  ingredients: string[];
}

export interface PantryItem {
  id: string;
  name: string;
  qty: number;
  /** a unit id from data/units.ts, or whatever the user typed */
  unit: string;
  place: 'fridge' | 'freezer' | 'pantry';
  /** day key — optional, only for things that go off */
  bestBefore?: string;
  /**
   * true: the date was looked up from data/shelfLife.ts and follows the item
   * when it moves shelf. false: you set it (or said it keeps), leave it alone.
   * Missing on items from before the lookup existed.
   */
  bestBeforeAuto?: boolean;
  /** other words for it from a barcode lookup, so a moved item is looked up again just as well */
  hints?: string[];
  addedAt: string;
}

/**
 * Something going onto a shelf. `bestBefore` undefined means "look it up",
 * null means "it keeps, no date", a day key is the date on the packet.
 */
export type NewPantryItem = Omit<PantryItem, 'id' | 'addedAt' | 'bestBefore' | 'bestBeforeAuto'> & {
  bestBefore?: string | null;
};

export interface ShoppingItem {
  id: string;
  name: string;
  qty: number;
  done: boolean;
  from?: string;
}

export interface PinnedNote {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface SprintRecord {
  id: string;
  startedAt: string;
  minutes: number;
  taskIds: string[];
  completed: number;
  coins: number;
}

export interface Achievement {
  id: string;
  unlockedAt: string;
}

export type PetKind = 'cat' | 'dog' | 'bird' | 'bunny' | 'other';

/** One of your real pets, with a pixel preset to show them by. */
export interface MyPet {
  id: string;
  name: string;
  kind: PetKind;
  /** a pixel pet piece id; every preset is free for your own pet */
  look: string;
  createdAt: string;
}

/** A quick-tapped bit of care: fed, watered, litter box done… */
export interface PetCare {
  id: string;
  petId: string;
  /** an action id from CARE in src/lib/pets.ts */
  action: string;
  at: string;
}

export type SupplyKind = 'food' | 'treats' | 'litter' | 'hay' | 'bedding' | 'meds' | 'other';

/** Something your pets go through, and how fast. */
export interface PetSupply {
  id: string;
  name: string;
  kind: SupplyKind;
  /** how much there was at `updatedAt` */
  amount: number;
  /** a full pack, for one-tap restocking */
  full: number;
  unit: string;
  /** how much goes each day; 0 = not tracked */
  perDay: number;
  updatedAt: string;
}
