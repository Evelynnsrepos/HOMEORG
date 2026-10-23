import { surfaces, type Surface, type SurfaceKind } from '../data/roomSurfaces';

/**
 * Walls and floors for the room pictures: pixel tiles from the same LPC
 * sheets as the stickers, so the room and what's in it share one view and
 * one pixel size. They're free — only stickers come from the draw.
 */

const byId = new Map(surfaces.map((s) => [s.id, s]));

/** The drawn vector surfaces from before, and the pixel tile closest to each. */
const LEGACY: Record<string, string> = {
  wall_plaster: 'wall-painted-02',
  wall_sage: 'wall-pinstripe-08',
  wall_clay: 'wall-painted-29',
  wall_botanic: 'wall-floral-07',
  wall_blush: 'wall-candy-blush',
  wall_night: 'wall-painted-48',
  floor_oak: 'floor-boards-04',
  floor_ash: 'floor-boards-09',
  floor_herring: 'floor-herringbone-03',
  floor_tile: 'floor-chequer-02',
  floor_sisal: 'floor-parquet-01',
  floor_slate: 'floor-flagstone-04',
};

const FALLBACK: Record<SurfaceKind, string> = { wall: 'wall-painted-blush', floor: 'floor-boards-04' };

/** Any stored id — new, old or unknown — as a tile to draw. */
export function surfaceFor(kind: SurfaceKind, id: string | undefined): Surface {
  const s = byId.get(id ?? '') ?? byId.get(LEGACY[id ?? ''] ?? '');
  return s && s.kind === kind ? s : byId.get(FALLBACK[kind]) ?? surfaces.find((x) => x.kind === kind)!;
}

/** What a new room of each type starts with: soft, and mostly pink. */
export const ROOM_SURFACES: Record<string, [string, string]> = {
  kitchen: ['wall-painted-02', 'floor-chequer-blush'],
  living: ['wall-candy-blush', 'floor-boards-04'],
  bathroom: ['wall-dotty-blush', 'floor-tiles-blush'],
  bedroom: ['wall-floral-blush', 'floor-boards-09'],
  kids: ['wall-dotty-02', 'floor-squares-blush'],
  dining: ['wall-ribbon-blush', 'floor-herringbone-03'],
  office: ['wall-pinstripe-08', 'floor-parquet-01'],
  hallway: ['wall-painted-34', 'floor-harlequin-blush'],
  laundry: ['wall-dotty-03', 'floor-tiles-02'],
  guest: ['wall-floral-10', 'floor-boards-09'],
  garage: ['wall-painted-04', 'floor-flagstone-04'],
  storage: ['wall-painted-04', 'floor-flagstone-01'],
  balcony: ['wall-floral-07', 'floor-flagstone-01'],
  wc: ['wall-dotty-blush', 'floor-mosaic-blush'],
};
export const DEFAULT_SURFACES: [string, string] = ['wall-painted-blush', 'floor-boards-04'];

/**
 * The room picture in art pixels: six tiles wide, the lower part of a wall
 * cell (its top trim is cropped off, like a camera looking in) and the floor.
 */
export const ART_W = 192;
export const WALL_CROP = 32;
export const WALL_H = 128 - WALL_CROP;
export const ART_H = 160;
