import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { pieces, stickerSets, type Rarity } from '../src/data/stickerCatalog';
import { REWARDS } from '../src/lib/rewards';
import {
  DRAW_PRICE,
  TEN_DRAW_PRICE,
  daysUntilRotation,
  featuredSets,
  pieceById,
  setProgress,
} from '../src/lib/stickers';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Bar, Btn, Card, IconBtn, Press, Row, Screen, Spacer, T, tapSuccess } from '../src/ui/base';
import { Confetti } from '../src/ui/Confetti';
import { PieceImage } from '../src/ui/StickerLayer';
import { Splashes } from '../src/ui/PixelSplash';

const rarityText: Record<Rarity, string> = { common: 'Common', rare: 'Rare', epic: 'Epic' };
const rarityTone = (r: Rarity) => (r === 'epic' ? colors.gold : r === 'rare' ? colors.lilac : colors.sage);

/**
 * The sticker machine. Coins in, a capsule out, and inside it always a piece
 * you don't have yet — from this month's three sets, which change on the
 * first of every month. Coins only come from looking after your home and
 * yourself; there is nothing to buy here with real money, ever.
 */
export default function StickerDraw() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const coins = useStore((s) => s.coins);
  const owned = useStore((s) => s.pieces ?? []);
  const rooms = useStore((s) => s.rooms);
  const drawPieces = useStore((s) => s.drawPieces);

  const [got, setGot] = useState<string[] | null>(null);
  const [burst, setBurst] = useState(0);
  const shake = useRef(new Animated.Value(0)).current;

  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const featured = featuredSets();
  const days = daysUntilRotation();
  const inner = Math.min(W, 520) - 32;
  const left = pieces.length - owned.length;

  function draw(n: number, price: number) {
    // a little wobble of the machine before the capsule drops
    Animated.sequence(
      [6, -6, 4, -4, 0].map((v) =>
        Animated.timing(shake, { toValue: v, duration: 70, easing: Easing.linear, useNativeDriver: true }),
      ),
    ).start(() => {
      const res = drawPieces(n, price);
      if (!res) return;
      tapSuccess();
      setGot(res);
      setBurst((b) => b + 1);
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Splashes width={Math.min(W, 520)} spots={[{ x: 0.5, y: 230, size: 230, tone: 'lilac', strength: 0.8 }, { x: 0.06, y: 760, size: 130 }]} />
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => router.back()} />
          <T v="heading">Sticker draw</T>
          <Row style={{ backgroundColor: colors.goldSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, gap: 5 }}>
            <Ionicons name="ellipse" size={11} color={colors.gold} />
            <T v="label" style={{ fontSize: 12 }} color={colors.goldDeep}>
              {coins}
            </T>
          </Row>
        </Row>

        {/* the machine ---------------------------------------------------- */}
        <Spacer h={12} />
        <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Animated.View style={{ transform: [{ translateX: shake }] }}>
            <Machine size={150} />
          </Animated.View>
          <Spacer h={10} />
          <T v="title" center>
            Every draw is a new piece
          </T>
          <T v="caption" center style={{ maxWidth: 280 }}>
            {left ? `${left} pieces still out there. No doubles, ever.` : 'You found every single piece. Wow.'}
          </T>
          <Spacer h={14} />
          <Row style={{ gap: 8, alignSelf: 'stretch' }}>
            <Btn
              style={{ flex: 1 }}
              icon="sparkles"
              label={`Draw 1 · ${DRAW_PRICE}`}
              disabled={coins < DRAW_PRICE || !left}
              onPress={() => draw(1, DRAW_PRICE)}
            />
            <Btn
              style={{ flex: 1 }}
              tone="quiet"
              label={`Draw 10 · ${TEN_DRAW_PRICE}`}
              disabled={coins < TEN_DRAW_PRICE || !left}
              onPress={() => draw(10, TEN_DRAW_PRICE)}
            />
          </Row>
          {coins < DRAW_PRICE ? (
            <>
              <Spacer h={8} />
              <T v="caption" center>
                {DRAW_PRICE - coins} more coins for the next draw. A chore or two will do it.
              </T>
            </>
          ) : null}
        </Card>

        {/* this month ----------------------------------------------------- */}
        <Spacer h={18} />
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="over">In the machine this month</T>
          <T v="caption" color={colors.coralDeep}>
            changes in {days} {days === 1 ? 'day' : 'days'}
          </T>
        </Row>
        <Spacer h={8} />
        {featured.map((sid) => {
          const set = stickerSets.find((s) => s.id === sid)!;
          const { have, total } = setProgress(ownedSet, sid);
          const preview = pieces.filter((p) => p.set === sid && p.rarity !== 'common').slice(0, 4);
          return (
            <Card key={sid} style={{ marginBottom: 8, padding: 14 }}>
              <Row style={{ gap: 10 }}>
                <T style={{ fontSize: 26 }}>{set.emoji}</T>
                <View style={{ flex: 1 }}>
                  <T v="heading">{set.name}</T>
                  <T v="caption">
                    {have} of {total} found
                  </T>
                  <Spacer h={5} />
                  <Bar pct={(have / total) * 100} color={colors.coral} height={5} />
                </View>
              </Row>
              <Spacer h={10} />
              <Row style={{ gap: 6 }}>
                {preview.map((p) => (
                  <View
                    key={p.id}
                    style={{
                      flex: 1,
                      height: 54,
                      borderRadius: radius.sm,
                      backgroundColor: colors.cardAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: ownedSet.has(p.id) ? 1 : 0.35,
                    }}
                  >
                    <PieceImage piece={p.id} width={Math.min(44, 44 * Math.min(1, p.w / p.h))} />
                  </View>
                ))}
              </Row>
            </Card>
          );
        })}

        {/* where coins come from ----------------------------------------- */}
        <Spacer h={14} />
        <T v="over">Coins come from looking after things</T>
        <Spacer h={8} />
        <Card style={{ padding: 6 }}>
          {[
            ['checkmark-circle', 'A chore done', 'by effort, plus momentum'],
            ['restaurant', REWARDS.cook.label, `+${REWARDS.cook.coins}`],
            ['camera', REWARDS.photo.label, `+${REWARDS.photo.coins} a photo`],
            ['snow', REWARDS.pantry.label, `+${REWARDS.pantry.coins} a thing`],
            ['calendar', REWARDS.bestBefore.label, `+${REWARDS.bestBefore.coins}`],
            ['document-text', REWARDS.import.label, `+${REWARDS.import.coins}`],
            ['cart', REWARDS.shopping.label, `+${REWARDS.shopping.coins}`],
            ['book', REWARDS.recipe.label, `+${REWARDS.recipe.coins}`],
            ['heart', REWARDS.mood.label, `+${REWARDS.mood.coins} a day`],
            ['flame', 'Streak kept', 'up to +15 a day'],
            ['trophy', 'Week streak', '+40 and up'],
          ].map(([icon, label, value], i) => (
            <Row key={label} style={{ paddingVertical: 8, paddingHorizontal: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.lineSoft }}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={15} color={colors.coralDeep} />
              <T v="body" color={colors.ink} style={{ flex: 1 }}>
                {label}
              </T>
              <T v="label" color={colors.goldDeep}>
                {value}
              </T>
            </Row>
          ))}
        </Card>
        <Spacer h={6} />
        <T v="caption" center>
          No real money, no ads, no shortcuts. Just you and your home.
        </T>

        {/* the whole collection ------------------------------------------ */}
        <Spacer h={18} />
        <T v="over">Your collection</T>
        <Spacer h={8} />
        <Row style={{ flexWrap: 'wrap', gap: 8 }}>
          {stickerSets.map((set) => {
            const { have, total } = setProgress(ownedSet, set.id);
            return (
              <View
                key={set.id}
                style={{
                  width: (inner - 8) / 2,
                  backgroundColor: colors.card,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: featured.includes(set.id) ? colors.coral : colors.lineSoft,
                  padding: 10,
                }}
              >
                <T v="label" color={colors.ink} numberOfLines={1}>
                  {set.emoji} {set.name}
                </T>
                <T v="caption">
                  {have} / {total}
                </T>
                <Spacer h={4} />
                <Bar pct={(have / total) * 100} color={featured.includes(set.id) ? colors.coral : colors.sage} height={4} />
              </View>
            );
          })}
        </Row>
        <Spacer h={10} />
        <T v="caption" center>
          Pixel art from LPC Revised by Eliza Wyatt, Lanea Zimmerman and friends (CC-BY / OGA-BY). Full credits on the About screen.
        </T>
      </Screen>

      {got ? (
        <Reveal
          ids={got}
          onClose={() => setGot(null)}
          onPlace={rooms.length ? () => (setGot(null), router.push(`/decorate/${rooms[0].id}`)) : undefined}
        />
      ) : null}
      <Confetti trigger={burst} spread={260} />
    </View>
  );
}

/** What came out of the capsules. */
function Reveal({ ids, onClose, onPlace }: { ids: string[]; onClose: () => void; onPlace?: () => void }) {
  const pop = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [pop]);
  return (
    <Pressable
      onPress={onClose}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#3D2836CC', justifyContent: 'center', padding: 16 }}
    >
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Pressable onPress={() => {}}>
          <Card style={{ padding: 18, maxHeight: 560 }}>
            <T v="title" center>
              {ids.length ? (ids.length === 1 ? 'A new piece!' : `${ids.length} new pieces!`) : 'Nothing left to find'}
            </T>
            <Spacer h={12} />
            <ScrollView style={{ maxHeight: 400 }}>
              <Row style={{ flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {ids.map((id) => {
                  const p = pieceById(id);
                  if (!p || p.type !== 'pixel') return null;
                  const set = stickerSets.find((s) => s.id === p.piece.set);
                  const box = ids.length === 1 ? 150 : 86;
                  return (
                    <View key={id} style={{ width: box + 16, alignItems: 'center' }}>
                      <View
                        style={{
                          width: box + 16,
                          height: box + 16,
                          borderRadius: radius.md,
                          backgroundColor: colors.cardAlt,
                          borderWidth: 2,
                          borderColor: rarityTone(p.piece.rarity),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PieceImage piece={id} width={box * Math.min(1, p.piece.w / p.piece.h)} />
                      </View>
                      <T v="caption" center style={{ fontFamily: font.semi }} color={rarityTone(p.piece.rarity)}>
                        {rarityText[p.piece.rarity]}
                      </T>
                      {ids.length === 1 ? (
                        <T v="caption" center>
                          {p.piece.label} · {set?.emoji} {set?.name}
                        </T>
                      ) : null}
                    </View>
                  );
                })}
              </Row>
            </ScrollView>
            <Spacer h={14} />
            <Row style={{ gap: 8 }}>
              {onPlace ? <Btn style={{ flex: 1 }} small icon="color-palette" label="Stick it somewhere" onPress={onPlace} /> : null}
              <Btn style={{ flex: 1 }} small tone="quiet" label="Lovely" onPress={onClose} />
            </Row>
          </Card>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

/** A little capsule machine, drawn flat like the rest of the app. */
function Machine({ size }: { size: number }) {
  const capsules = [
    [36, 40, colors.coral],
    [58, 30, colors.lilac],
    [44, 58, colors.gold],
    [66, 52, colors.sage],
    [52, 44, '#7FC4F0'],
    [30, 60, colors.lilac],
    [70, 68, colors.coral],
  ] as const;
  return (
    <Svg width={size} height={size * 1.2} viewBox="0 0 100 120">
      <Circle cx={50} cy={46} r={38} fill="#FFFFFF" stroke={colors.line} strokeWidth={3} />
      {capsules.map(([x, y, c], i) => (
        <React.Fragment key={i}>
          <Circle cx={x} cy={y} r={9} fill={c} />
          <Path d={`M${x - 9},${y} A9,9 0 0 0 ${x + 9},${y} Z`} fill="#FFFFFF" opacity={0.7} />
        </React.Fragment>
      ))}
      <Path d="M28,22 Q40,12 54,14" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.9} />
      <Rect x={18} y={78} width={64} height={36} rx={10} fill={colors.coral} />
      <Rect x={38} y={92} width={24} height={14} rx={5} fill={colors.coralDeep} />
      <Circle cx={30} cy={92} r={6} fill="#FFFFFF" />
      <Rect x={67} y={86} width={6} height={12} rx={3} fill={colors.goldSoft} />
    </Svg>
  );
}
