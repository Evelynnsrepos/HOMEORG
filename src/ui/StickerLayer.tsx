import React from 'react';
import { Image, View } from 'react-native';

import { aspect, pieceById, type PlacedSticker } from '../lib/stickers';
import { FurnitureTile } from './Furniture';

/**
 * One piece at a given width: a pixel sticker from the library, or one of the
 * original drawn pieces. Pixel art is stretched, never smoothed into a
 * different shape — the files are already 4x so it stays crisp.
 */
export function PieceImage({ piece, width }: { piece: string; width: number }) {
  const p = pieceById(piece);
  if (!p) return null;
  const h = width * aspect(p);
  if (p.type === 'svg') return <FurnitureTile kind={p.item.kind} palette={p.item.palette} size={width} />;
  return <Image source={p.piece.src} style={{ width, height: h }} resizeMode="stretch" fadeDuration={0} />;
}

/**
 * All the stickers of a room, laid over its picture: back to front, each
 * centred on its spot, turned and mirrored. `selected` gets a dashed frame.
 */
export function StickerLayer({
  stickers,
  width,
  height,
  selected,
}: {
  stickers: PlacedSticker[];
  width: number;
  height: number;
  selected?: string | null;
}) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height }}>
      {[...stickers]
        .sort((a, b) => a.z - b.z)
        .map((k) => {
          const p = pieceById(k.piece);
          if (!p) return null;
          const w = k.size * width;
          const h = w * aspect(p);
          return (
            <View
              key={k.id}
              style={{
                position: 'absolute',
                left: k.x * width - w / 2,
                top: k.y * height - h / 2,
                width: w,
                height: h,
                transform: [{ rotate: `${k.rot}deg` }, { scaleX: k.flip ? -1 : 1 }],
              }}
            >
              <PieceImage piece={k.piece} width={w} />
              {selected === k.id ? (
                <View
                  style={{
                    position: 'absolute',
                    left: -4,
                    top: -4,
                    right: -4,
                    bottom: -4,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: '#FF79B0',
                    borderRadius: 6,
                  }}
                />
              ) : null}
            </View>
          );
        })}
    </View>
  );
}

/** Which sticker is under a tap, front-most first; rotation is ignored, close enough for a finger. */
export function stickerAt(stickers: PlacedSticker[], x: number, y: number, width: number, height: number): string | null {
  const front = [...stickers].sort((a, b) => b.z - a.z);
  for (const k of front) {
    const p = pieceById(k.piece);
    if (!p) continue;
    const w = k.size * width;
    const h = w * aspect(p);
    const cx = k.x * width;
    const cy = k.y * height;
    if (Math.abs(x - cx) <= w / 2 + 6 && Math.abs(y - cy) <= h / 2 + 6) return k.id;
  }
  return null;
}
