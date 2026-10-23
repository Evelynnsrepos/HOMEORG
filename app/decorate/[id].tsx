import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { floorings, itemById, wallpapers } from '../../src/data/shop';
import { pieces, stickerSets } from '../../src/data/stickerCatalog';
import { defaultSize, pieceById, type PlacedSticker } from '../../src/lib/stickers';
import { useStore } from '../../src/state/store';
import { colors, radius } from '../../src/theme';
import { Btn, Empty, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../../src/ui/base';
import { ROOM_ASPECT, RoomCanvas } from '../../src/ui/RoomCanvas';
import { PieceImage, stickerAt } from '../../src/ui/StickerLayer';

type Tab = 'stickers' | 'walls' | 'floors';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Decorating a room is sticking stickers on it: any piece you own, as many
 * times as you like, anywhere, any size, turned and mirrored, stacked in any
 * order. Drag with one finger, pinch to resize, twist to turn — or use the
 * buttons under the room, which do the same in small steps.
 *
 * The room and the toolbar stay put while the tray below scrolls, so moving a
 * sticker never scrolls the page instead.
 */
export default function Decorate() {
  const { width: W } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const room = useStore((s) => s.rooms.find((r) => r.id === id));
  const owned = useStore((s) => s.pieces ?? []);
  const inventory = useStore((s) => s.inventory);
  const coins = useStore((s) => s.coins);
  const addSticker = useStore((s) => s.addSticker);
  const updateSticker = useStore((s) => s.updateSticker);
  const removeSticker = useStore((s) => s.removeSticker);
  const layerSticker = useStore((s) => s.layerSticker);
  const setSurface = useStore((s) => s.setSurface);

  const [tab, setTab] = useState<Tab>('stickers');
  const [shelf, setShelf] = useState<string>('original');
  const [selected, setSelected] = useState<string | null>(null);
  /** the selected sticker while a finger is on it, before it's saved */
  const [draft, setDraft] = useState<PlacedSticker | null>(null);

  const width = Math.min(W, 520) - 32;
  const height = width * ROOM_ASPECT;

  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const shelves = useMemo(
    () => [
      { id: 'original', name: 'Originals', emoji: '🪑', count: inventory.length },
      ...stickerSets.map((s) => ({ ...s, count: pieces.filter((p) => p.set === s.id && ownedSet.has(p.id)).length })),
    ],
    [inventory, ownedSet],
  );
  const tray = useMemo(
    () =>
      shelf === 'original'
        ? inventory.filter((i) => itemById(i)).map((i) => `svg:${i}`)
        : pieces.filter((p) => p.set === shelf && ownedSet.has(p.id)).map((p) => p.id),
    [shelf, inventory, ownedSet],
  );

  // gesture bookkeeping: where the sticker was when the fingers came down
  const base = useRef<PlacedSticker | null>(null);
  const live = useRef({ dx: 0, dy: 0, scale: 1, rot: 0 });
  const fingers = useRef(0);

  if (!room) {
    return (
      <Screen>
        <Empty emoji={'\u{1F6AA}'} title="Room not found" />
      </Screen>
    );
  }

  const stickers = room.stickers ?? [];
  const current = stickers.find((k) => k.id === selected) ?? null;
  const shown = draft ? stickers.map((k) => (k.id === draft.id ? draft : k)) : stickers;

  const begin = () => {
    if (!current) return;
    if (fingers.current++ === 0) {
      base.current = current;
      live.current = { dx: 0, dy: 0, scale: 1, rot: 0 };
    }
  };
  const move = () => {
    const b = base.current;
    if (!b) return;
    const l = live.current;
    setDraft({
      ...b,
      x: clamp(b.x + l.dx / width, -0.1, 1.1),
      y: clamp(b.y + l.dy / height, -0.1, 1.1),
      size: clamp(b.size * l.scale, 0.04, 1.4),
      rot: Math.round(b.rot + l.rot),
    });
  };
  const end = () => {
    if (--fingers.current > 0) return;
    fingers.current = 0;
    const b = base.current;
    base.current = null;
    setDraft((d) => {
      if (d && b) updateSticker(room.id, d.id, { x: d.x, y: d.y, size: d.size, rot: d.rot });
      return null;
    });
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .maxPointers(2)
    .onBegin(begin)
    .onUpdate((e) => {
      live.current.dx = e.translationX;
      live.current.dy = e.translationY;
      move();
    })
    .onFinalize(end);
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onBegin(begin)
    .onUpdate((e) => {
      live.current.scale = e.scale;
      move();
    })
    .onFinalize(end);
  const twist = Gesture.Rotation()
    .runOnJS(true)
    .onBegin(begin)
    .onUpdate((e) => {
      live.current.rot = (e.rotation * 180) / Math.PI;
      move();
    })
    .onFinalize(end);
  const pick = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      const hit = stickerAt(stickers, e.x, e.y, width, height);
      if (hit !== selected) tap();
      setSelected(hit);
    });
  const gestures = Gesture.Race(pick, Gesture.Simultaneous(pan, pinch, twist));

  const nudge = (patch: Partial<PlacedSticker>) => {
    if (!current) return;
    tap();
    updateSticker(room.id, current.id, patch);
  };

  const place = (piece: string) => {
    const p = pieceById(piece);
    if (!p) return;
    tap();
    // a little off-centre each time, so a second copy doesn't hide the first
    const jitter = () => (Math.random() - 0.5) * 0.16;
    const sid = addSticker(room.id, piece, {
      size: defaultSize(p),
      x: 0.5 + jitter(),
      y: (p.type === 'pixel' && p.piece.kind === 'wall') || (p.type === 'svg' && p.item.zone === 'wall') ? 0.3 : 0.62 + jitter() / 2,
    });
    setSelected(sid);
  };

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => router.back()} />
          <T v="heading">
            {room.emoji} {room.name}
          </T>
          <Press onPress={() => router.push('/shop')}>
            <Row
              style={{
                backgroundColor: colors.goldSoft,
                borderRadius: radius.pill,
                paddingHorizontal: 10,
                paddingVertical: 5,
                gap: 5,
              }}
            >
              <Ionicons name="ellipse" size={11} color={colors.gold} />
              <T v="label" style={{ fontSize: 12 }} color={colors.goldDeep}>
                {coins}
              </T>
            </Row>
          </Press>
        </Row>

        {/* the room ------------------------------------------------------ */}
        <Spacer h={10} />
        <GestureDetector gesture={gestures}>
          <View
            collapsable={false}
            style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, alignSelf: 'center' }}
          >
            <RoomCanvas room={{ ...room, stickers: shown }} width={width} selected={selected} />
          </View>
        </GestureDetector>

        {/* what to do with the selected one ------------------------------ */}
        <Spacer h={8} />
        {current ? (
          <Row style={{ justifyContent: 'space-between', gap: 4 }}>
            <Tool icon="remove" label="Smaller" onPress={() => nudge({ size: clamp(current.size / 1.15, 0.04, 1.4) })} />
            <Tool icon="add" label="Bigger" onPress={() => nudge({ size: clamp(current.size * 1.15, 0.04, 1.4) })} />
            <Tool icon="refresh" label="Turn" onPress={() => nudge({ rot: current.rot + 15 })} />
            <Tool icon="swap-horizontal" label="Mirror" onPress={() => nudge({ flip: !current.flip })} />
            <Tool icon="arrow-up" label="Front" onPress={() => (tap(), layerSticker(room.id, current.id, 'front'))} />
            <Tool icon="arrow-down" label="Back" onPress={() => (tap(), layerSticker(room.id, current.id, 'back'))} />
            <Tool
              icon="copy-outline"
              label="Copy"
              onPress={() => {
                tap();
                const { id: _old, z: _z, ...rest } = current;
                setSelected(addSticker(room.id, current.piece, { ...rest, x: rest.x + 0.04, y: rest.y + 0.04 }));
              }}
            />
            <Tool
              icon="trash-outline"
              label="Remove"
              onPress={() => {
                tap();
                removeSticker(room.id, current.id);
                setSelected(null);
              }}
            />
          </Row>
        ) : (
          <T v="caption" center>
            {stickers.length
              ? 'Tap a sticker to move it. Drag, pinch to resize, twist to turn.'
              : 'Pick a sticker below and it lands in the room.'}
          </T>
        )}

        <Spacer h={10} />
        <Row style={{ gap: 6 }}>
          {(['stickers', 'walls', 'floors'] as Tab[]).map((t) => (
            <Press
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 8,
                borderRadius: radius.pill,
                backgroundColor: tab === t ? colors.coralSoft : colors.cardAlt,
              }}
            >
              <T v="label" color={tab === t ? colors.coralDeep : colors.inkSoft}>
                {t === 'stickers' ? 'Stickers' : t === 'walls' ? 'Wallpaper' : 'Floor'}
              </T>
            </Press>
          ))}
        </Row>
      </View>

      {/* the tray -------------------------------------------------------- */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 10 }}>
        {tab === 'stickers' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Row style={{ gap: 6 }}>
                {shelves.map((s) => (
                  <Press
                    key={s.id}
                    onPress={() => setShelf(s.id)}
                    style={{
                      paddingHorizontal: 11,
                      paddingVertical: 7,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: shelf === s.id ? colors.coral : colors.line,
                      backgroundColor: shelf === s.id ? colors.coralSoft : colors.card,
                      opacity: s.count ? 1 : 0.5,
                    }}
                  >
                    <T v="caption" color={shelf === s.id ? colors.coralDeep : colors.inkSoft}>
                      {s.emoji} {s.name} · {s.count}
                    </T>
                  </Press>
                ))}
              </Row>
            </ScrollView>
            <Spacer h={10} />
            {tray.length ? (
              <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                {tray.map((piece) => (
                  <Press
                    key={piece}
                    onPress={() => place(piece)}
                    style={{
                      width: (width - 24) / 4,
                      height: (width - 24) / 4,
                      borderRadius: radius.md,
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.lineSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Fit piece={piece} box={(width - 24) / 4 - 14} />
                  </Press>
                ))}
              </Row>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 18, gap: 10 }}>
                <T v="body" center>
                  No stickers from this set yet.
                </T>
                <Btn small full={false} icon="sparkles" label="Draw some" onPress={() => router.push('/shop')} />
              </View>
            )}
          </>
        ) : null}

        {tab === 'walls' ? (
          <Row style={{ flexWrap: 'wrap', gap: 10 }}>
            {wallpapers.map((w) => (
              <Surface
                key={w.id}
                name={w.name}
                base={w.base}
                accent={w.accent}
                width={(width - 20) / 3}
                active={room.wallpaper === w.id}
                onPress={() => setSurface(room.id, 'wallpaper', w.id)}
              />
            ))}
          </Row>
        ) : null}

        {tab === 'floors' ? (
          <Row style={{ flexWrap: 'wrap', gap: 10 }}>
            {floorings.map((f) => (
              <Surface
                key={f.id}
                name={f.name}
                base={f.base}
                accent={f.accent}
                width={(width - 20) / 3}
                active={room.flooring === f.id}
                onPress={() => setSurface(room.id, 'flooring', f.id)}
              />
            ))}
          </Row>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

/** A piece shrunk to fit a square, keeping its shape. */
function Fit({ piece, box }: { piece: string; box: number }) {
  const p = pieceById(piece);
  if (!p) return null;
  const ratio = p.type === 'pixel' ? p.piece.h / p.piece.w : 1;
  return <PieceImage piece={piece} width={ratio > 1 ? box / ratio : box} />;
}

function Tool({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        paddingVertical: 7,
        borderRadius: radius.md,
        backgroundColor: pressed ? colors.coralSoft : colors.cardAlt,
      })}
    >
      <Ionicons name={icon} size={17} color={colors.ink} />
      <T v="caption" style={{ fontSize: 9 }}>
        {label}
      </T>
    </Pressable>
  );
}

function Surface({
  name,
  base,
  accent,
  width,
  active,
  onPress,
}: {
  name: string;
  base: string;
  accent: string;
  width: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Press
      onPress={onPress}
      style={{
        width,
        borderRadius: radius.md,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: active ? colors.coral : colors.lineSoft,
      }}
    >
      <View style={{ height: 54, backgroundColor: base }}>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: accent }} />
      </View>
      <T v="caption" center style={{ paddingVertical: 5, fontSize: 10 }}>
        {name}
      </T>
    </Press>
  );
}
