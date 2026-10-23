import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { cookableNow, expiringSoon, matchRecipes } from '../../src/lib/kitchen';
import { dayKey } from '../../src/lib/date';
import { PRESETS, SCALES, isHardDay, nearestPreset } from '../../src/lib/mood';
import { pickChallenge } from '../../src/lib/suggest';
import { useHomeHealth, useRooms, useStreak, useToday } from '../../src/state/derived';
import { useStore } from '../../src/state/store';
import { band, bandColor, bandLabel, colors, font, radius, shadow } from '../../src/theme';
import { EffortRing, FridgeGauge, fridgeWord } from '../../src/ui/Art';
import { Bar, Card, Press, Ring, Row, Screen, Spacer, T } from '../../src/ui/base';
import { ScreenGarland, Sticker } from '../../src/ui/Decor';
import { ScriptTitle } from '../../src/ui/Script';
import { PixelSplash, Splashes } from '../../src/ui/PixelSplash';
import { FRIDGE_FULL, reminders } from '../../src/lib/remind';
import { DontForget, PetWidget } from '../../src/ui/Pets';

const FOCUS_MINUTES = [15, 25, 45];
const MOOD_TINT = { mood: '#FF79B0', social: '#B48CF0', clean: '#6FCDA8', hobby: '#FFB35C' } as const;
/** a fridge with this many things in it reads as full on the gauge */

/**
 * Home, laid out like the sketch: cleanliness up top, then the fridge with
 * what could be cooked beside it, a challenge, pinned info next to a focus
 * timer, and everything about to go off at the bottom — as long as that list
 * needs to be. Every card is a doorway to the screen that does the work.
 */
export default function HomeTab() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const settings = useStore((s) => s.settings);
  const coins = useStore((s) => s.coins);
  const notes = useStore((s) => s.notes);
  const todayMood = useStore((s) => (s.moods ?? []).filter((m) => m.day === dayKey()).at(-1));
  const saveMood = useStore((s) => s.saveMood);
  const pantry = useStore((s) => s.pantry);
  const recipes = useStore((s) => s.recipes);
  const progress = useStore((s) => s.challenges);
  const custom = useStore((s) => s.customChallenges);
  const rooms = useRooms();
  const health = useHomeHealth();
  const streak = useStreak();
  const plan = useToday();

  const b = band(health);
  const dueCount = plan.tasks.length;

  const soon = useMemo(() => expiringSoon(pantry, 4), [pantry]);
  const pets = useStore((s) => s.pets);
  const petLog = useStore((s) => s.petLog);
  const supplies = useStore((s) => s.petSupplies);
  const nudges = useMemo(
    () => reminders({ pantry, petMode: settings.petMode, pets, petLog, supplies }),
    [pantry, settings.petMode, pets, petLog, supplies],
  );
  const cookable = useMemo(() => {
    const ready = cookableNow(recipes, pantry);
    // ready ones first, then the closest, so the column is never half empty
    const ids = new Set(ready.map((m) => m.recipe.id));
    return [...ready, ...matchRecipes(recipes, pantry).filter((m) => !ids.has(m.recipe.id))].slice(0, 5);
  }, [recipes, pantry]);
  const allReady = cookable.length > 0 && cookable.every((m) => !m.missing.length && m.recipe.ingredients.length);

  const challenge = useMemo(
    () =>
      pickChallenge(
        [...rooms].sort((x, y) => x.health - y.health).map((r) => r.room),
        progress,
        custom,
      ),
    [rooms, progress, custom],
  );

  const inFridge = pantry.filter((i) => i.place === 'fridge');
  const fridgeSoon = soon.filter((i) => i.place === 'fridge').length;
  const fridgeLevel = inFridge.length / FRIDGE_FULL;
  const fridgeSays = fridgeWord(fridgeLevel);
  const colW = (Math.min(W, 520) - 32 - 10) / 2;

  return (
    <Screen>
      <Splashes width={Math.min(W, 520)} spots={[{ x: 0.9, y: 150, size: 170 }, { x: 0.06, y: 540, size: 150, tone: 'lilac' }, { x: 0.94, y: 1000, size: 130, tone: 'gold' }]} />
      <ScreenGarland height={84} />

      {/* Header ---------------------------------------------------- */}
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingLeft: 14 }}>
          <T v="over" color={colors.coralDeep}>
            Homeorg&lt;3
          </T>
          <T v="title" numberOfLines={1}>
            {settings.householdName}
          </T>
        </View>
        <Row style={{ gap: 7, paddingRight: 14 }}>
          <Press onPress={() => router.push('/shop')}>
            <Row style={pill(colors.goldSoft)}>
              <Ionicons name="ellipse" size={11} color={colors.gold} />
              <T v="heading" style={{ fontSize: 12.5 }} color={colors.goldDeep}>
                {coins}
              </T>
            </Row>
          </Press>
          <Row style={pill(colors.coralSoft)}>
            <Ionicons name="flame" size={12} color={colors.ember} />
            <T v="heading" style={{ fontSize: 12.5 }} color={colors.coralDeep}>
              {streak}
            </T>
          </Row>
        </Row>
      </Row>

      {/* Household cleanliness -------------------------------------- */}
      <Spacer h={16} />
      <Press onPress={() => router.push('/house')}>
        <Card>
          <Row style={{ gap: 16 }}>
            <View style={{ flex: 1 }}>
              <T v="over">Household cleanliness</T>
              <Spacer h={4} />
              <T v="heading" color={bandColor[b]}>
                {bandLabel[b]}
              </T>
              <T v="caption">
                {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} · tap to open the house
              </T>
              <Spacer h={10} />
              <Press
                onPress={() => router.push('/today')}
                style={{
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: colors.coralSoft,
                  borderRadius: radius.pill,
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                }}
              >
                <Ionicons name="checkbox-outline" size={13} color={colors.coralDeep} />
                <T v="caption" color={colors.coralDeep} style={{ fontFamily: font.semi }}>
                  {settings.vacation
                    ? 'Vacation mode'
                    : dueCount === 0
                      ? 'Nothing due today'
                      : `${dueCount} ${dueCount === 1 ? 'chore' : 'chores'} today`}
                </T>
                <Ionicons name="chevron-forward" size={11} color={colors.coralDeep} />
              </Press>
            </View>
            <Ring pct={health} size={96} stroke={11} color={bandColor[b]}>
              <T v="title" style={{ fontSize: 23 }}>
                {health}
                <T v="caption" style={{ fontSize: 11 }}>
                  %
                </T>
              </T>
            </Ring>
          </Row>
          <Sticker kind="heart" size={40} tilt={14} style={{ position: 'absolute', right: -8, top: -14 }} />
        </Card>
      </Press>

      {/* Fridge + challenge | could be cooked ------------------------ */}
      <Spacer h={10} />
      <Row style={{ gap: 10, alignItems: 'stretch' }}>
        <View style={{ width: colW, gap: 10 }}>
          <Press onPress={() => router.push('/pantry')}>
            <Card style={{ padding: 13 }}>
              <CardHead icon="snow-outline" title="Fridge status" />
              <Spacer h={34} />
              <View style={{ alignItems: 'center' }}>
                <FridgeGauge level={fridgeLevel} width={colW * 0.72} />
              </View>
              {/* written across the card on a slant, like on the sketch board */}
              <ScriptTitle
                words={fridgeSays.word.split(' ')}
                size={30}
                step={1.1}
                tilt={-12}
                color={fridgeSays.color}
                outline={colors.card}
                style={{ position: 'absolute', top: 26, left: 6 }}
              />
              <Spacer h={6} />
              <T v="caption" numberOfLines={2}>
                {inFridge.length
                  ? `${inFridge.length} ${inFridge.length === 1 ? 'thing' : 'things'} inside${fridgeSoon ? ` · ${fridgeSoon} to use soon` : ''}`
                  : 'Empty, or not written down yet'}
              </T>
            </Card>
          </Press>

          <Press
            onPress={() => router.push(challenge ? `/challenge/${challenge.id}` : '/challenges')}
            style={{ flex: 1 }}
          >
            <Card style={{ padding: 13, flex: 1 }}>
              <CardHead icon="trophy-outline" title="Challenges" />
              <Spacer h={8} />
              {challenge ? (
                <>
                  <Row style={{ gap: 8 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 11,
                        backgroundColor: challenge.color + '33',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <T style={{ fontSize: 16 }}>{challenge.emoji}</T>
                    </View>
                    <T v="label" color={colors.ink} style={{ flex: 1, fontFamily: font.semi }} numberOfLines={2}>
                      {challenge.name}
                    </T>
                  </Row>
                  <Spacer h={6} />
                  {challenge.running ? (
                    <>
                      <T v="caption">
                        {challenge.done} of {challenge.total} done
                      </T>
                      <Spacer h={4} />
                      <Bar pct={(challenge.done / Math.max(1, challenge.total)) * 100} color={colors.coral} height={5} />
                    </>
                  ) : (
                    <T v="caption" numberOfLines={3}>
                      Suggested for your rooms. {challenge.blurb}
                    </T>
                  )}
                </>
              ) : (
                <T v="caption">All done. Make your own one?</T>
              )}
            </Card>
          </Press>
        </View>

        <Card style={{ width: colW, padding: 13 }}>
          <Press onPress={() => router.push('/cook')}>
            <CardHead icon="restaurant-outline" title={allReady ? 'Could be cooked now' : 'Could be cooked'} />
          </Press>
          <Spacer h={6} />
          {cookable.length ? (
            <View style={{ gap: 7, paddingTop: 2 }}>
              {cookable.map(({ recipe, missing }) => {
                const look = scatter(recipe.id);
                return (
                  <Press
                    key={recipe.id}
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                    style={{
                      alignSelf: look.side,
                      width: `${look.width}%`,
                      transform: [{ rotate: `${look.tilt}deg` }, { scale: look.scale }],
                      backgroundColor: colors.cardAlt,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor: colors.line,
                      paddingHorizontal: 9,
                      paddingVertical: 7,
                      ...shadow.card,
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  >
                    <Row style={{ gap: 6, alignItems: 'flex-start' }}>
                      <T v="label" color={colors.ink} style={{ flex: 1, fontFamily: font.semi, fontSize: 12.5 }} numberOfLines={2}>
                        {recipe.name}
                      </T>
                      <EffortRing effort={recipe.effort} size={16} />
                    </Row>
                    {pantry.length && recipe.ingredients.length ? (
                      <T v="caption" style={{ fontSize: 10 }} color={missing.length ? colors.inkMuted : colors.sageDeep}>
                        {missing.length ? `${missing.length} to buy` : 'All in the kitchen'}
                      </T>
                    ) : null}
                  </Press>
                );
              })}
            </View>
          ) : (
            <Press onPress={() => router.push('/recipe/new')}>
              <T v="caption">Write your first recipe down and it shows up here.</T>
            </Press>
          )}
          <View style={{ flex: 1 }} />
          <Press onPress={() => router.push('/cook')}>
            <Row style={{ gap: 3, marginTop: 6 }}>
              <T v="caption" color={colors.coralDeep}>
                Let's cook it
              </T>
              <Ionicons name="chevron-forward" size={12} color={colors.coralDeep} />
            </Row>
          </Press>
        </Card>
      </Row>

      {/* How do you feel? | Focus now? ---------------------------------- */}
      <Spacer h={10} />
      <Row style={{ gap: 10, alignItems: 'stretch' }}>
        <Card style={{ flex: 1, padding: 13, overflow: 'hidden' }}>
          <PixelSplash size={110} tone="lilac" pixel={5} seed={4} style={{ right: -36, bottom: -40 }} />
          <Press onPress={() => router.push('/mood')}>
            <Row style={{ justifyContent: 'space-between' }}>
              <CardHead icon="heart-outline" title="How do you feel?" tint={colors.coralDeep} />
              <Ionicons name="options-outline" size={14} color={colors.inkMuted} />
            </Row>
          </Press>
          <Spacer h={8} />
          <Row style={{ gap: 4 }}>
            {PRESETS.map((p) => {
              const on = todayMood?.preset === p.id || (!todayMood?.preset && todayMood && nearestPreset(todayMood).id === p.id);
              return (
                <Press
                  key={p.id}
                  accessibilityLabel={`Feeling ${p.label.toLowerCase()}`}
                  onPress={() => {
                    saveMood({ ...p.values, preset: p.id });
                    // a hard day gets a kind word straight away
                    if (isHardDay({ ...p.values, preset: p.id })) router.push('/mood?comfort=1');
                  }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 6,
                    borderRadius: radius.sm,
                    backgroundColor: on ? colors.coralSoft : colors.cardAlt,
                    borderWidth: on ? 1.5 : 0,
                    borderColor: colors.coral,
                  }}
                >
                  <T style={{ fontSize: 20 }}>{p.emoji}</T>
                </Press>
              );
            })}
          </Row>
          <Spacer h={8} />
          {todayMood ? (
            <Press onPress={() => router.push('/mood')}>
              <Row style={{ gap: 5 }}>
                {SCALES.map((sc) => (
                  <View key={sc.key} style={{ flex: 1 }}>
                    <Bar pct={todayMood[sc.key]} height={4} color={MOOD_TINT[sc.key]} />
                  </View>
                ))}
              </Row>
              <T v="caption" style={{ marginTop: 4 }}>
                Mood · people · cleaning · hobbies. Tap to adjust.
              </T>
            </Press>
          ) : (
            <Press onPress={() => router.push('/mood')}>
              <T v="caption">One tap is enough. Or slide it out in detail ›</T>
            </Press>
          )}
        </Card>

        <Card style={{ width: colW * 0.62, padding: 11 }}>
          <Press onPress={() => router.push('/focus')}>
            <CardHead icon="timer-outline" title="Focus" />
          </Press>
          <Spacer h={6} />
          <View style={{ gap: 5 }}>
            {FOCUS_MINUTES.map((m) => (
              <Press
                key={m}
                onPress={() => router.push(`/sprint?minutes=${m}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: 3,
                  backgroundColor: colors.cardAlt,
                  borderRadius: radius.sm,
                  paddingVertical: 5,
                }}
              >
                <T style={{ fontFamily: font.display, fontSize: 16, color: colors.ink }}>{m}</T>
                <T v="caption" style={{ fontSize: 10 }}>
                  min
                </T>
              </Press>
            ))}
          </View>
        </Card>
      </Row>

      {/* Info --------------------------------------------------------- */}
      <Spacer h={10} />
      <Press onPress={() => router.push('/notes')}>
        <Card style={{ paddingVertical: 11, paddingHorizontal: 13 }}>
          <Row style={{ gap: 10 }}>
            <CardHead icon="star" title="Info" tint={colors.gold} />
            <T v="caption" numberOfLines={1} style={{ flex: 1 }}>
              {notes.length
                ? notes
                    .slice(0, 3)
                    .map((n) => n.title)
                    .join(' · ')
                : 'Wifi code, bin days, the boiler. Pin them here.'}
            </T>
            <Ionicons name="chevron-forward" size={13} color={colors.inkMuted} />
          </Row>
        </Card>
      </Press>

      {/* Don't forget this | Pets ----------------------------------- */}
      <Spacer h={10} />
      {settings.petMode ? (
        <Row style={{ gap: 10, alignItems: 'stretch' }}>
          <View style={{ width: colW }}>
            <DontForget items={nudges} width={colW} max={5} />
          </View>
          <PetWidget width={colW} />
        </Row>
      ) : (
        <View>
          <DontForget items={nudges} />
          <Sticker kind="icecream" size={38} tilt={-12} style={{ position: 'absolute', right: -6, top: -16 }} />
        </View>
      )}
    </Screen>
  );
}

/**
 * A little card's own look: a slight tilt, a touch bigger or smaller, nudged
 * left or right. Seeded by the recipe id so each card keeps its look between
 * renders instead of jittering.
 */
function scatter(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const r = (shift: number) => ((h >>> shift) & 255) / 255;
  return {
    tilt: (r(0) - 0.5) * 7,
    scale: 0.94 + r(8) * 0.1,
    width: 88 + Math.round(r(16) * 12),
    side: (r(24) < 0.5 ? 'flex-start' : 'flex-end') as 'flex-start' | 'flex-end',
  };
}

function pill(bg: string) {
  return {
    backgroundColor: bg,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 4,
  } as const;
}

function CardHead({
  icon,
  title,
  tint = colors.inkSoft,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tint?: string;
}) {
  return (
    <Row style={{ gap: 6, flexShrink: 1 }}>
      <Ionicons name={icon} size={14} color={tint} />
      <T v="over" color={tint === colors.inkSoft ? undefined : tint} style={{ flexShrink: 1 }}>
        {title}
      </T>
    </Row>
  );
}
