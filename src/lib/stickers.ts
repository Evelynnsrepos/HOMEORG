import { itemById, type ShopItem } from '../data/shop';
import { pieces, stickerSets, type Piece, type Rarity } from '../data/stickerCatalog';
import type { PlacedSticker } from './types';

export type { PlacedSticker };

/*
 * Rooms are decorated with stickers: any piece, anywhere, any size, any
 * angle, mirrored or not, stacked in any order. A piece is either pixel art
 * from the sticker library ("lounge-042") or one of the original drawn pieces
 * from before the library existed ("svg:sofa_sage"), which everybody keeps.
 *
 * Positions are fractions of the room picture, so a room looks the same on a
 * phone, a tablet and the little card on Home.
 */

export type AnyPiece =
  | { type: 'pixel'; id: string; piece: Piece }
  | { type: 'svg'; id: string; item: ShopItem };

const byId = new Map(pieces.map((p) => [p.id, p]));

export function pieceById(id: string): AnyPiece | undefined {
  if (id.startsWith('svg:')) {
    const item = itemById(id.slice(4));
    return item ? { type: 'svg', id, item } : undefined;
  }
  const piece = byId.get(id);
  return piece ? { type: 'pixel', id, piece } : undefined;
}

/** Height over width, so a sticker keeps its shape at any size. */
export function aspect(p: AnyPiece): number {
  return p.type === 'pixel' ? p.piece.h / p.piece.w : 1;
}

/**
 * How big a piece first lands: pixel pieces at the scale they were drawn
 * (a room is about 260 of their pixels across), drawn pieces by what they are.
 */
export function defaultSize(p: AnyPiece): number {
  if (p.type === 'svg') return p.item.zone === 'small' ? 0.16 : p.item.zone === 'wall' ? 0.22 : 0.3;
  return Math.min(0.55, Math.max(0.07, p.piece.w / 260));
}

/* ---- from the old ten slots ----------------------------------------- */

// the slot centres and sizes RoomCanvas used, in its 200 x (120 - 12) picture
const OLD_SLOTS: [number, number, number][] = [
  [42, 74, 40], [100, 70, 46], [158, 74, 40],
  [52, 112, 62], [104, 116, 68], [154, 112, 56],
  [26, 110, 50], [174, 110, 50],
  [70, 118, 32], [136, 118, 32],
];

/** A room decorated with the old slots, as stickers in the same places. */
export function stickersFromSlots(decor: (string | null)[] | undefined, makeId: () => string): PlacedSticker[] {
  const out: PlacedSticker[] = [];
  (decor ?? []).forEach((itemId, i) => {
    const slot = OLD_SLOTS[i];
    if (!itemId || !slot || !itemById(itemId)) return;
    const [cx, baseY, size] = slot;
    const rug = itemById(itemId)?.kind === 'rug';
    out.push({
      id: makeId(),
      piece: `svg:${itemId}`,
      x: cx / 200,
      y: (baseY - size / 2 - 12) / 108,
      size: size / 200,
      rot: 0,
      // rugs lie under everything, wall pieces behind the floor ones
      z: rug ? 0 : i < 3 ? 1 : i < 8 ? 2 : 3,
    });
  });
  return out;
}

/* ---- the gacha ------------------------------------------------------- */

export const DRAW_PRICE = 60;
export const TEN_DRAW_PRICE = 540;
export const FEATURED_PER_MONTH = 3;

const RARITY_WEIGHT: Record<Rarity, number> = { common: 70, rare: 25, epic: 5 };

/**
 * The sets you can draw from this month. They turn over on the first of every
 * month, three at a time, so every set comes round again every four months.
 */
export function featuredSets(on = new Date()): string[] {
  const month = on.getFullYear() * 12 + on.getMonth();
  return Array.from(
    { length: FEATURED_PER_MONTH },
    (_, k) => stickerSets[(month * FEATURED_PER_MONTH + k) % stickerSets.length].id,
  );
}

/** Days left until the sets change. */
export function daysUntilRotation(on = new Date()): number {
  const next = new Date(on.getFullYear(), on.getMonth() + 1, 1);
  return Math.ceil((next.getTime() - on.getTime()) / 86_400_000);
}

/**
 * One draw: always a piece you don't have yet, from one of this month's sets
 * (each as likely as the others), the common ones more often. When those are complete it reaches into every set,
 * and only when you own the whole library is there nothing left to draw.
 */
export function drawPiece(owned: Set<string>, featured: string[], random = Math.random): Piece | null {
  const pick = (pool: Piece[]) => {
    if (!pool.length) return null;
    const total = pool.reduce((s, p) => s + RARITY_WEIGHT[p.rarity], 0);
    let r = random() * total;
    for (const p of pool) {
      r -= RARITY_WEIGHT[p.rarity];
      if (r <= 0) return p;
    }
    return pool[pool.length - 1];
  };
  const fresh = (p: Piece) => !owned.has(p.id);
  // a set first, evenly, then a piece in it: otherwise a set with 450 pillows
  // would drown one with 23 Christmas things
  const open = featured.filter((sid) => pieces.some((p) => p.set === sid && fresh(p)));
  if (open.length) {
    const sid = open[Math.floor(random() * open.length)];
    return pick(pieces.filter((p) => p.set === sid && fresh(p)));
  }
  return pick(pieces.filter(fresh));
}

/** The welcome kit: two common pieces from every set, so every room can start somewhere. */
export function starterPieces(random = Math.random): string[] {
  const out: string[] = [];
  for (const set of stickerSets) {
    // a set of nothing but big sofas has no commons; start with its rares then
    const mine = pieces.filter((p) => p.set === set.id);
    const commons = mine.filter((p) => p.rarity === 'common');
    const pool = commons.length >= 2 ? commons : mine.filter((p) => p.rarity !== 'epic');
    for (let i = 0; i < 2 && pool.length; i++) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0].id);
  }
  return out;
}

export function setProgress(owned: Set<string>, setId: string): { have: number; total: number } {
  const all = pieces.filter((p) => p.set === setId);
  return { have: all.filter((p) => owned.has(p.id)).length, total: all.length };
}
