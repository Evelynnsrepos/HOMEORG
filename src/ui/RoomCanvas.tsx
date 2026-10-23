import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect } from 'react-native-svg';

import { floorings, itemById, wallpapers, type Zone } from '../data/shop';
import type { Room } from '../lib/types';
import { Fixtures } from './Fixtures';
import { Furniture } from './Furniture';
import { StickerLayer } from './StickerLayer';

/**
 * One room, drawn flat and face on: a papered wall, a strip of floor, the
 * fixtures that came with the room type, and whatever you have put in the ten
 * slots. Everything is vector, so it costs nothing to ship and scales cleanly.
 */

export const VB_W = 200;
export const VB_H = 120;
const FLOOR_Y = 88;
/** how much empty wall to crop off the top, so the cards stay compact */
const VB_TOP = 12;

/** height of the whole canvas as a fraction of its width */
export const ROOM_ASPECT = (VB_H - VB_TOP) / VB_W;

export interface Slot {
  zone: Zone;
  cx: number;
  baseY: number;
  size: number;
  hint: string;
}

/** Ten slots, each with an obvious destination — no free dragging. */
export const SLOTS: Slot[] = [
  { zone: 'wall', cx: 42, baseY: 74, size: 40, hint: 'Left wall' },
  { zone: 'wall', cx: 100, baseY: 70, size: 46, hint: 'Centre wall' },
  { zone: 'wall', cx: 158, baseY: 74, size: 40, hint: 'Right wall' },
  { zone: 'floor', cx: 52, baseY: 112, size: 62, hint: 'Left of the room' },
  { zone: 'floor', cx: 104, baseY: 116, size: 68, hint: 'Middle of the room' },
  { zone: 'floor', cx: 154, baseY: 112, size: 56, hint: 'Right of the room' },
  { zone: 'corner', cx: 26, baseY: 110, size: 50, hint: 'Left corner' },
  { zone: 'corner', cx: 174, baseY: 110, size: 50, hint: 'Right corner' },
  { zone: 'small', cx: 70, baseY: 118, size: 32, hint: 'Front left' },
  { zone: 'small', cx: 136, baseY: 118, size: 32, hint: 'Front right' },
];

export function slotAccepts(slot: Slot, zone: Zone): boolean {
  if (slot.zone === zone) return true;
  if (slot.zone === 'wall' || zone === 'wall') return false;
  // corners take tall floor pieces, small spots take little ones
  return true;
}

/* ------------------------------------------------------------------ *
 * Surfaces
 * ------------------------------------------------------------------ */

function Wallpaper({ id }: { id: string }) {
  const w = wallpapers.find((x) => x.id === id) ?? wallpapers[0];
  return (
    <G>
      <Rect x={0} y={0} width={VB_W} height={FLOOR_Y} fill={w.base} />
      {w.pattern === 'stripe'
        ? Array.from({ length: 13 }).map((_, i) => (
            <Rect key={i} x={i * 16} y={0} width={7} height={FLOOR_Y} fill={w.accent} />
          ))
        : null}
      {w.pattern === 'wash' ? (
        <Rect x={0} y={FLOOR_Y * 0.42} width={VB_W} height={FLOOR_Y} fill={w.accent} opacity={0.6} />
      ) : null}
      {w.pattern === 'dots'
        ? Array.from({ length: 18 }).map((_, i) => (
            <Circle
              key={i}
              cx={12 + (i % 6) * 36 + (Math.floor(i / 6) % 2) * 18}
              cy={12 + Math.floor(i / 6) * 24}
              r={3}
              fill={w.accent}
            />
          ))
        : null}
      {w.pattern === 'leaf'
        ? Array.from({ length: 12 }).map((_, i) => {
            const x = 14 + (i % 6) * 34 + (Math.floor(i / 6) % 2) * 16;
            const y = 16 + Math.floor(i / 6) * 28;
            return (
              <Path key={i} d={`M${x} ${y} q7 -8 14 0 q-7 8 -14 0`} fill={w.accent} opacity={0.85} />
            );
          })
        : null}
      {w.pattern === 'stars'
        ? Array.from({ length: 18 }).map((_, i) => (
            <Circle
              key={i}
              cx={10 + ((i * 37) % 190)}
              cy={8 + ((i * 53) % 76)}
              r={i % 3 === 0 ? 2 : 1.2}
              fill="#F4E7C4"
              opacity={0.8}
            />
          ))
        : null}
    </G>
  );
}

function Flooring({ id }: { id: string }) {
  const f = floorings.find((x) => x.id === id) ?? floorings[0];
  const h = VB_H - FLOOR_Y;
  return (
    <G>
      <Rect x={0} y={FLOOR_Y} width={VB_W} height={h} fill={f.base} />
      {f.pattern === 'plank'
        ? [0, 1].map((i) => (
            <Line
              key={i}
              x1={0}
              y1={FLOOR_Y + 9 + i * 11}
              x2={VB_W}
              y2={FLOOR_Y + 9 + i * 11}
              stroke={f.accent}
              strokeWidth={1.4}
            />
          ))
        : null}
      {f.pattern === 'herring'
        ? Array.from({ length: 14 }).map((_, i) => (
            <G key={i}>
              <Line
                x1={i * 15}
                y1={VB_H}
                x2={i * 15 + 10}
                y2={FLOOR_Y}
                stroke={f.accent}
                strokeWidth={1.4}
              />
              <Line
                x1={i * 15}
                y1={FLOOR_Y}
                x2={i * 15 + 10}
                y2={VB_H}
                stroke={f.accent}
                strokeWidth={1.4}
              />
            </G>
          ))
        : null}
      {f.pattern === 'check'
        ? Array.from({ length: 16 }).map((_, i) => {
            const col = i % 8;
            const row = Math.floor(i / 8);
            if ((col + row) % 2) return null;
            return (
              <Rect
                key={i}
                x={col * 25}
                y={FLOOR_Y + row * 16}
                width={25}
                height={16}
                fill={f.accent}
              />
            );
          })
        : null}
      {f.pattern === 'weave'
        ? Array.from({ length: 20 }).map((_, i) => (
            <Line
              key={i}
              x1={i * 10}
              y1={FLOOR_Y}
              x2={i * 10}
              y2={VB_H}
              stroke={f.accent}
              strokeWidth={1.2}
            />
          ))
        : null}
      {f.pattern === 'stone'
        ? [0, 1].map((r) =>
            Array.from({ length: 5 }).map((_, i) => (
              <Rect
                key={`${r}-${i}`}
                x={i * 40 + (r % 2 ? 14 : 0)}
                y={FLOOR_Y + 2 + r * 15}
                width={34}
                height={11}
                rx={3}
                fill={f.accent}
                opacity={0.7}
              />
            )),
          )
        : null}
      <Line x1={0} y1={FLOOR_Y} x2={VB_W} y2={FLOOR_Y} stroke="#00000018" strokeWidth={2} />
    </G>
  );
}

function Placed({ slot, itemId }: { slot: Slot; itemId: string }) {
  const item = itemById(itemId);
  if (!item) return null;
  const s = slot.size / 100;
  return (
    <G transform={`translate(${slot.cx - slot.size / 2}, ${slot.baseY - slot.size}) scale(${s})`}>
      <Furniture kind={item.kind} palette={item.palette} />
    </G>
  );
}

/* ------------------------------------------------------------------ *
 * The canvas
 * ------------------------------------------------------------------ */

export function RoomCanvas({
  room,
  width,
  height,
  dim = 0,
  editing = false,
  activeSlot,
  selected,
}: {
  room: Room;
  width: number;
  height?: number;
  /** 0 = sparkling, 1 = fully faded */
  dim?: number;
  editing?: boolean;
  activeSlot?: number | null;
  /** the sticker being moved in the editor */
  selected?: string | null;
}) {
  const h = height ?? width * ROOM_ASPECT;
  const decor = room.decor ?? [];
  // rooms with stickers draw those; the old slots are only for rooms that predate them
  const stickers = room.stickers;

  // Rugs lie flat, then walls, then the corners, floor and little things in
  // front of them — so nothing ends up behind the sofa it should sit on.
  const rank = (index: number) => {
    const item = itemById(decor[index]);
    if (item?.kind === 'rug') return 0;
    const zone = SLOTS[index].zone;
    return zone === 'wall' ? 1 : zone === 'corner' ? 2 : zone === 'floor' ? 3 : 4;
  };
  const order = [...SLOTS.keys()].sort((a, b) => rank(a) - rank(b) || a - b);

  return (
    <View style={{ width, height: h, overflow: 'hidden', borderRadius: 8 * (width / VB_W) }}>
    <Svg width={width} height={h} viewBox={`0 ${VB_TOP} ${VB_W} ${VB_H - VB_TOP}`}>
      <Defs>
        <ClipPath id={`clip-${room.id}`}>
          <Rect x={0} y={VB_TOP} width={VB_W} height={VB_H - VB_TOP} rx={8} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#clip-${room.id})`}>
        <Wallpaper id={room.wallpaper} />
        <Flooring id={room.flooring} />
        <Fixtures typeId={room.typeId} />

        {stickers
          ? null
          : order.map((i) => {
              const id = decor[i];
              return id ? <Placed key={i} slot={SLOTS[i]} itemId={id} /> : null;
            })}

        {editing && !stickers
          ? SLOTS.map((slot, i) =>
              decor[i] && activeSlot !== i ? null : (
                <Rect
                  key={`ghost-${i}`}
                  x={slot.cx - slot.size / 2 + 4}
                  y={slot.baseY - slot.size + 6}
                  width={slot.size - 8}
                  height={slot.size - 12}
                  rx={6}
                  fill={activeSlot === i ? '#EE8A6C22' : 'none'}
                  stroke={activeSlot === i ? '#EE8A6C' : '#00000022'}
                  strokeWidth={activeSlot === i ? 2.5 : 1.4}
                  strokeDasharray={activeSlot === i ? undefined : '4 4'}
                />
              ),
            )
          : null}

      </G>
    </Svg>
    {stickers ? <StickerLayer stickers={stickers} width={width} height={h} selected={selected} /> : null}
    {dim > 0 ? (
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, top: 0, width, height: h, backgroundColor: '#5B4B36', opacity: dim * 0.32 }}
      />
    ) : null}
    </View>
  );
}
