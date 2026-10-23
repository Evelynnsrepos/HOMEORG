import { itemById, type ShopItem } from '../data/shop';
import { pieces, stickerSets, type Piece, type Rarity } from '../data/stickerCatalog';
import { ART_H, ART_W } from './surfaces';
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
 * (a room is 192 of their pixels across), drawn pieces by what they are.
 */
export function defaultSize(p: AnyPiece): number {
  if (p.type === 'svg') return p.item.zone === 'small' ? 0.16 : p.item.zone === 'wall' ? 0.22 : 0.3;
  return Math.min(0.55, Math.max(0.07, p.piece.w / ART_W));
}

/* ---- a new room's first pieces -------------------------------------- */

// [piece id or label, centre x, bottom y] in the 192 x 160 art-pixel room; the
// wall ends at 96. Ids are hand-picked where a sheet's biggest piece is a
// group shot; rugs come first so they lie under everything.
type Spot = [string | RegExp, number, number];
const STARTERS: Record<string, Spot[]> = {
  kitchen: [['fridge-03', 26, 118], ['oven-modern-01', 62, 118], ['sink-countertop-02', 112, 114], ['kitchen-clutter-a-07', 112, 64], [/^Flowers/, 165, 144]],
  living: [['rainbow-rug-02', 96, 160], ['loveseat-small-casual-solid-a-02', 96, 140], [/^Paintings, Landscape/, 96, 52], ['lighting-floor-02', 166, 128], [/^Flowers/, 26, 144]],
  bathroom: [['sink-pedestal-01', 68, 118], [/^Mirrors/, 68, 60], [/^Flowers/, 150, 136]],
  bedroom: [['beds-single-a-07', 96, 158], [/^Paintings, Abstract/, 96, 52], ['end-table-11', 45, 118], ['lighting-table-01', 45, 100], ['dresser-03', 158, 118]],
  kids: [['rainbow-checkered-rug-02', 128, 160], ['beds-single-a-06', 52, 158], [/^Paintings, Portraits/, 135, 58], [/^Games/, 128, 148]],
  dining: [['table-ornate-wood-04', 96, 148], [/^Paintings, Still Life/, 96, 58], ['lighting-wall-07', 158, 48], [/^Flowers/, 30, 144]],
  office: [['desk-office-04', 90, 128], ['chair-office-02', 90, 158], ['shelf-04', 166, 118], [/^Paintings, Landscape/, 38, 58]],
  hallway: [['rainbow-rug-04', 96, 160], ['mirror-standing-01', 45, 128], [/^Clock, Grandfather/, 150, 118], ['lighting-wall-07', 96, 48]],
  laundry: [[/^Baskets/, 52, 144], [/^Buckets/, 135, 144], ['shelf-02', 96, 58]],
  guest: [['beds-single-a-01', 75, 158], [/^Paintings, Landscape/, 96, 52], ['end-table-01', 150, 118]],
  garage: [['workbench-carpentry-01', 82, 128], [/^Boxes/, 158, 148], [/^Ladder/, 22, 128]],
  storage: [['crate-03', 45, 148], ['crate-05', 75, 154], [/^Boxes/, 142, 148], ['shelf-04', 150, 118]],
  balcony: [['planter-01', 60, 150], [/^Flowers/, 142, 148], ['lighting-outdoors-01', 168, 118]],
  wc: [['sink-pedestal-02', 96, 118], [/^Mirrors/, 96, 60]],
  custom: [[/^Flowers/, 45, 144], [/^Paintings, Abstract/, 96, 52]],
};

/**
 * A few pixel pieces so a new room isn't bare: the biggest single piece matching
 * each label (the whole bed, not its pillow), standing where it would in a room.
 */
export function starterStickers(typeId: string, makeId: () => string): PlacedSticker[] {
  const out: PlacedSticker[] = [];
  (STARTERS[typeId] ?? STARTERS.custom).forEach(([label, cx, bottom], i) => {
    // sheets sometimes hold a row of things cut as one; keep to one-object sizes
    const fits = (p: Piece) => p.w <= 130 && p.h <= 100 && p.h / p.w < 3.2;
    const piece =
      typeof label === 'string'
        ? pieces.find((p) => p.id === label)
        : pieces.filter((p) => label.test(p.label) && fits(p)).sort((a, b) => b.w * b.h - a.w * a.h)[0];
    if (!piece) return;
    const w = Math.min(piece.w, ART_W * 0.55);
    const h = (w * piece.h) / piece.w;
    out.push({ id: makeId(), piece: piece.id, x: cx / ART_W, y: (bottom - h / 2) / ART_H, size: w / ART_W, rot: 0, z: i });
  });
  return out;
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
