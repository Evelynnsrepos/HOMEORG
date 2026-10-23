import React from 'react';
import { Image, View } from 'react-native';

import type { Surface } from '../data/roomSurfaces';
import { ART_H, ART_W, WALL_CROP, WALL_H, surfaceFor } from '../lib/surfaces';
import type { Room } from '../lib/types';
import { StickerLayer } from './StickerLayer';

/**
 * One room in the same 3/4 top-down view as the stickers: a papered back wall
 * with its trim and baseboard, and the floor seen from above in front of it.
 * Both are pixel tiles laid edge to edge at the stickers' pixel size, so a
 * sofa and the boards under it look like they were drawn together.
 */

/** height of the whole canvas as a fraction of its width */
export const ROOM_ASPECT = ART_H / ART_W;

/**
 * A surface repeated over an area. Edges are rounded to whole points and each
 * tile ends where the next begins, so no hairline gaps show between them.
 */
function Tiled({ s, k, top, height, width }: { s: Surface; k: number; top: number; height: number; width: number }) {
  const out: React.ReactNode[] = [];
  for (let y = 0; y < height / k; y += s.h) {
    for (let x = 0; x < width / k; x += s.w) {
      const l = Math.round(x * k);
      const t = Math.round(y * k);
      out.push(
        <Image
          key={`${x}-${y}`}
          source={s.src}
          fadeDuration={0}
          resizeMode="stretch"
          style={{ position: 'absolute', left: l, top: top + t, width: Math.round((x + s.w) * k) - l, height: Math.round((y + s.h) * k) - t }}
        />,
      );
    }
  }
  return <>{out}</>;
}

export function RoomCanvas({
  room,
  width,
  dim = 0,
  selected,
}: {
  room: Room;
  width: number;
  /** 0 = sparkling, 1 = fully faded */
  dim?: number;
  /** the sticker being moved in the editor */
  selected?: string | null;
}) {
  const h = width * ROOM_ASPECT;
  const k = width / ART_W;
  const wall = surfaceFor('wall', room.wallpaper);
  const floor = surfaceFor('floor', room.flooring);
  const wallH = Math.round(WALL_H * k);

  return (
    <View style={{ width, height: h, overflow: 'hidden', borderRadius: 10 }}>
      <Tiled s={floor} k={k} top={wallH} height={h - wallH} width={width} />
      <Tiled s={wall} k={k} top={-Math.round(WALL_CROP * k)} height={wallH + Math.round(WALL_CROP * k)} width={width} />
      {/* the soft shadow where the floor meets the wall */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: wallH, height: Math.max(2, 3 * k), backgroundColor: '#2A141C', opacity: 0.18 }} />
      <StickerLayer stickers={room.stickers ?? []} width={width} height={h} selected={selected} />
      {dim > 0 ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, top: 0, width, height: h, backgroundColor: '#5B4B36', opacity: dim * 0.32 }}
        />
      ) : null}
    </View>
  );
}
