import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { places } from '../../src/data/units';
import { cookableNow, expiringSoon, matchRecipes, shelfLifeLabel } from '../../src/lib/kitchen';
import { pickChallenge } from '../../src/lib/suggest';
import { useHomeHealth, useRooms, useStreak, useToday } from '../../src/state/derived';
import { useStore } from '../../src/state/store';
import { band, bandColor, bandLabel, colors, font, radius } from '../../src/theme';
import { Bar, Card, Press, Ring, Row, Screen, Spacer, T } from '../../src/ui/base';
import { CookTime, EffortMeter } from '../../src/ui/Kitchen';

const FOCUS_MINUTES = [15, 25, 45];

/**
 * Home: one card per thing the household runs on. Every card is a doorway to
 * the screen that does the work, so this screen itself holds no controls.
 */
export default function HomeTab() {
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const coins = useStore((s) => s.coins);
  const notes = useStore((s) => s.notes);
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

  const soon = useMemo(() => expiringSoon(pantry), [pantry]);
  const cookable = useMemo(() => {
    const ready = cookableNow(recipes, pantry);
    // nothing fully stocked? show the closest ones rather than an empty card
    return (ready.length ? ready : matchRecipes(recipes, pantry)).slice(0, 5);
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

  const shelfCounts = places.map((p) => ({
    ...p,
    n: pantry.filter((i) => i.place === p.id).length,
  }));
  const most = Math.max(1, ...shelfCounts.map((s) => s.n));

  return (
    <Screen>
      {/* Header ---------------------------------------------------- */}
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <T v="over">Homeorg&lt;3</T>
          <T v="title" numberOfLines={1}>
            {settings.householdName}
          </T>
        </View>
        <Row style={{ gap: 7 }}>
          <Press onPress={() => router.push('/shop')}>
            <Row style={pill(colors.goldSoft)}>
              <Ionicons name="ellipse" size={11} color={colors.gold} />
              <T v="heading" style={{ fontSize: 12.5 }} color="#8A6B1F">
                {coins}
              </T>
            </Row>
          </Press>
          <Row style={pill(colors.coralSoft)}>
            <Ionicons name="flame" size={12} color={colors.ember} />
            <T v="heading" style={{ fontSize: 12.5 }} color="#A64B32">
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
            <Ring pct={health} size={92} stroke={10} color={bandColor[b]}>
              <T v="title" style={{ fontSize: 22 }}>
                {health}
                <T v="caption" style={{ fontSize: 11 }}>
                  %
                </T>
              </T>
            </Ring>
            <View style={{ flex: 1 }}>
              <T v="over">Household cleanliness</T>
              <Spacer h={4} />
              <T v="heading" color={bandColor[b]}>
                {bandLabel[b]}
              </T>
              <T v="caption">
                {settings.vacation
                  ? 'Vacation mode'
                  : dueCount === 0
                    ? 'Nothing due today'
                    : `${dueCount} ${dueCount === 1 ? 'chore' : 'chores'} on today`}
                {' · '}
                {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
              </T>
              <Spacer h={8} />
              <Row style={{ gap: 3 }}>
                <T v="caption" color={colors.coralDeep}>
                  Open the house
                </T>
                <Ionicons name="chevron-forward" size={12} color={colors.coralDeep} />
              </Row>
            </View>
          </Row>
        </Card>
      </Press>

      {/* Fridge status + pinned info -------------------------------- */}
      <Spacer h={10} />
      <Row style={{ gap: 10, alignItems: 'stretch' }}>
        <Press style={{ flex: 1.2 }} onPress={() => router.push('/kitchen')}>
          <Card style={{ flex: 1, padding: 14 }}>
            <CardHead icon="snow-outline" title="Fridge status" />
            <Spacer h={10} />
            {shelfCounts.map((s) => (
              <View key={s.id} style={{ marginBottom: 7 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="caption">
                    {s.emoji} {s.name}
                  </T>
                  <T v="caption" color={colors.ink}>
                    {s.n}
                  </T>
                </Row>
                <Spacer h={3} />
                <Bar pct={(s.n / most) * 100} height={5} color={colors.sage} />
              </View>
            ))}
          </Card>
        </Press>

        <Press style={{ flex: 1 }} onPress={() => router.push('/notes')}>
          <Card style={{ flex: 1, padding: 14 }}>
            <CardHead icon="star" title="Info" tint={colors.gold} />
            <Spacer h={8} />
            {notes.length ? (
              notes.slice(0, 3).map((n, i) => (
                <View
                  key={n.id}
                  style={{
                    paddingVertical: 5,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: colors.lineSoft,
                  }}
                >
                  <T v="label" color={colors.ink} numberOfLines={1}>
                    {n.title}
                  </T>
                  {n.body ? (
                    <T v="caption" numberOfLines={1}>
                      {n.body}
                    </T>
                  ) : null}
                </View>
              ))
            ) : (
              <T v="caption">Wifi codes, bin days, the boiler. Pin them here.</T>
            )}
          </Card>
        </Press>
      </Row>

      {/* Could be cooked -------------------------------------------- */}
      <Spacer h={10} />
      <Card style={{ padding: 14 }}>
        <Press onPress={() => router.push('/cook')}>
          <Row style={{ justifyContent: 'space-between' }}>
            <CardHead
              icon="restaurant-outline"
              title={allReady ? 'Could be cooked now' : 'Could be cooked'}
            />
            <Row style={{ gap: 3 }}>
              <T v="caption" color={colors.coralDeep}>
                Let's cook it
              </T>
              <Ionicons name="chevron-forward" size={12} color={colors.coralDeep} />
            </Row>
          </Row>
        </Press>
        <Spacer h={6} />
        {cookable.length ? (
          cookable.map(({ recipe, missing }, i) => (
            <Press
              key={recipe.id}
              onPress={() => router.push(`/recipe/${recipe.id}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 8,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.lineSoft,
              }}
            >
              <T v="body" color={colors.ink} style={{ flex: 1 }} numberOfLines={1}>
                {recipe.name}
              </T>
              {pantry.length && recipe.ingredients.length && missing.length ? (
                <T v="caption">{missing.length} to buy</T>
              ) : null}
              <EffortMeter effort={recipe.effort} size={6} />
              <CookTime minutes={recipe.minutes} />
            </Press>
          ))
        ) : (
          <Press onPress={() => router.push('/recipe/new')}>
            <T v="caption">Write your first recipe down and it shows up here.</T>
          </Press>
        )}
      </Card>

      {/* Challenges ------------------------------------------------- */}
      {challenge ? (
        <>
          <Spacer h={10} />
          <Press onPress={() => router.push(`/challenge/${challenge.id}`)}>
            <Card style={{ padding: 14 }}>
              <CardHead
                icon="trophy-outline"
                title={challenge.running ? 'Your challenge' : 'A challenge for your rooms'}
              />
              <Spacer h={10} />
              <Row style={{ gap: 12 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: challenge.color + '33',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T style={{ fontSize: 22 }}>{challenge.emoji}</T>
                </View>
                <View style={{ flex: 1 }}>
                  <T v="heading">{challenge.name}</T>
                  <T v="caption" numberOfLines={2}>
                    {challenge.running
                      ? `${challenge.done} of ${challenge.total} done`
                      : challenge.blurb}
                  </T>
                  {challenge.running ? (
                    <>
                      <Spacer h={6} />
                      <Bar
                        pct={(challenge.done / Math.max(1, challenge.total)) * 100}
                        color={challenge.color}
                        height={5}
                      />
                    </>
                  ) : null}
                </View>
              </Row>
            </Card>
          </Press>
        </>
      ) : null}

      {/* Focus now? ------------------------------------------------- */}
      <Spacer h={10} />
      <Card style={{ padding: 14 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <CardHead icon="timer-outline" title="Focus now?" />
          <Press onPress={() => router.push('/focus')}>
            <T v="caption" color={colors.coralDeep}>
              One task at a time
            </T>
          </Press>
        </Row>
        <Spacer h={10} />
        <Row style={{ gap: 8 }}>
          {FOCUS_MINUTES.map((m) => (
            <Press
              key={m}
              onPress={() => router.push(`/sprint?minutes=${m}`)}
              style={{
                flex: 1,
                backgroundColor: colors.cardAlt,
                borderRadius: radius.md,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <T style={{ fontFamily: font.display, fontSize: 22, color: colors.ink }}>{m}</T>
              <T v="caption">min</T>
            </Press>
          ))}
        </Row>
      </Card>

      {/* About to expire -------------------------------------------- */}
      <Spacer h={10} />
      <Card style={{ padding: 14, borderColor: soon.length ? colors.needsLove : colors.lineSoft }}>
        <CardHead
          icon="time-outline"
          title={soon.length ? 'About to expire, please use it' : 'Nothing about to expire'}
          tint={soon.length ? colors.needsLove : undefined}
        />
        {soon.length ? (
          <>
            <Spacer h={8} />
            {soon.map((p, i) => {
              const where = places.find((pl) => pl.id === p.place);
              const label = shelfLifeLabel(p.bestBefore!);
              return (
                <Press
                  key={p.id}
                  onPress={() => router.push('/pantry')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 8,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: colors.lineSoft,
                  }}
                >
                  <T v="body" color={colors.ink} style={{ flex: 1 }} numberOfLines={1}>
                    {p.name}
                  </T>
                  <T v="caption" style={{ width: 74 }}>
                    {where ? `${where.emoji} ${where.name}` : ''}
                  </T>
                  <T
                    v="caption"
                    style={{ width: 62, textAlign: 'right' }}
                    color={label.endsWith('over') ? colors.needsYou : colors.needsLove}
                  >
                    {label}
                  </T>
                </Press>
              );
            })}
          </>
        ) : (
          <T v="caption" style={{ marginTop: 4 }}>
            Add a best-before date on the shelves and anything close to it shows up here.
          </T>
        )}
      </Card>
    </Screen>
  );
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
    <Row style={{ gap: 7, flexShrink: 1 }}>
      <Ionicons name={icon} size={15} color={tint} />
      <T v="over" color={tint === colors.inkSoft ? undefined : tint} style={{ flexShrink: 1 }}>
        {title}
      </T>
    </Row>
  );
}
