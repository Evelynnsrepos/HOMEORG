import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { clockTime, dayKey, fromDayKey, lastDoneLabel, monthShort, weekdayLong } from '../../src/lib/date';
import { creditedMinutes } from '../../src/lib/engine';
import { buildHype, hypeTitle } from '../../src/lib/hype';
import type { Completion } from '../../src/lib/types';
import { useStats } from '../../src/state/derived';
import { useStore } from '../../src/state/store';
import { colors, font, radius } from '../../src/theme';
import { Btn, Card, Press, Row, Screen, Spacer, T } from '../../src/ui/base';
import { ScreenGarland, Sticker } from '../../src/ui/Decor';

const sourceIcon: Record<Completion['source'], keyof typeof Ionicons.glyphMap> = {
  tick: 'checkmark',
  focus: 'disc-outline',
  sprint: 'timer-outline',
  wheel: 'sync-outline',
  challenge: 'trophy-outline',
};

const PAGE = 14;

type Entry = { kind: 'chore'; c: Completion } | { kind: 'cooked'; id: string; name: string; recipeId: string; at: string };

/**
 * "What did I do and when", as a hype screen: it should make you feel as good
 * as possible. The big numbers and the cheers up top are the Insights, read
 * the kindest way; below them every win, newest day first, cooking included.
 */
export default function History() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const completions = useStore((s) => s.completions);
  const tasks = useStore((s) => s.tasks);
  const rooms = useStore((s) => s.rooms);
  const recipes = useStore((s) => s.recipes);
  const cookLog = useStore((s) => s.cookLog ?? []);
  const sprints = useStore((s) => s.sprints);
  const coins = useStore((s) => s.coins);
  const name = useStore((s) => s.settings.householdName);
  const stats = useStats();
  const [days, setDays] = useState(PAGE);

  const hype = useMemo(
    () => buildHype({ completions, tasks, rooms, recipes, cookLog, sprints, bestStreak: stats.best.streak }),
    [completions, tasks, rooms, recipes, cookLog, sprints, stats.best.streak],
  );

  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  const byDay = useMemo(() => {
    const all: Entry[] = [
      ...completions.map((c) => ({ kind: 'chore' as const, c })),
      ...cookLog.map((m) => ({ kind: 'cooked' as const, ...m })),
    ];
    const at = (e: Entry) => (e.kind === 'chore' ? e.c.at : e.at);
    const groups = new Map<string, Entry[]>();
    for (const e of all.sort((a, b) => at(b).localeCompare(at(a)))) {
      const k = dayKey(at(e));
      const g = groups.get(k);
      if (g) g.push(e);
      else groups.set(k, [e]);
    }
    return [...groups.entries()];
  }, [completions, cookLog]);

  const shown = byDay.slice(0, days);
  const today = dayKey();

  const tiles = [
    { value: hype.chores, label: hype.chores === 1 ? 'chore done' : 'chores done', bg: colors.coralSoft, fg: colors.coralDeep },
    { value: hype.cooked, label: hype.cooked === 1 ? 'meal cooked' : 'meals cooked', bg: colors.goldSoft, fg: colors.goldDeep },
    { value: hype.minutes, label: 'minutes of care', bg: colors.sageSoft, fg: colors.sageDeep },
    { value: hype.bestStreak, label: 'best day streak', bg: colors.lilacSoft, fg: colors.lilacDeep },
    { value: coins, label: 'coins earned', bg: colors.goldSoft, fg: colors.goldDeep },
    { value: hype.dishes, label: hype.dishes === 1 ? 'dish mastered' : 'dishes mastered', bg: colors.coralSoft, fg: colors.coralDeep },
  ];
  const inner = Math.min(W, 520) - 32;
  const tileW = (inner - 16) / 3;

  return (
    <Screen>
      <ScreenGarland height={70} bulbs={4} seed={11} />

      {/* The hero ---------------------------------------------------- */}
      <View style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
        <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
          <Defs>
            <LinearGradient id="hero" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.coral} stopOpacity={0.7} />
              <Stop offset="0.55" stopColor={colors.coral} />
              <Stop offset="1" stopColor={colors.lilac} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#hero)" />
        </Svg>
        <View style={{ padding: 20, paddingTop: 22 }}>
          <T v="over" color="#FFF0F7">
            {name}
          </T>
          <Spacer h={4} />
          <T style={{ fontFamily: font.display, fontSize: 34, lineHeight: 38, color: '#FFFFFF', paddingRight: 70 }}>
            {hypeTitle(hype.chores, hype.cooked)}
          </T>
          <Spacer h={10} />
          <Row style={{ alignItems: 'flex-end', gap: 8 }}>
            <T style={{ fontFamily: font.display, fontSize: 64, lineHeight: 66, color: '#FFFFFF' }}>
              {hype.chores + hype.cooked}
            </T>
            <T v="label" color="#FFF0F7" style={{ marginBottom: 12, flex: 1 }}>
              things you did{'\n'}for your home 💖
            </T>
          </Row>
          {stats.streak ? (
            <Row style={{ gap: 6, alignSelf: 'flex-start', backgroundColor: '#FFFFFF33', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Ionicons name="flame" size={14} color="#FFFFFF" />
              <T v="label" color="#FFFFFF" style={{ fontFamily: font.semi }}>
                {stats.streak}-day streak going strong
              </T>
            </Row>
          ) : null}
        </View>
        <Sticker kind="star" size={58} tilt={12} style={{ position: 'absolute', right: 12, top: 14 }} />
        <Sticker kind="heart" size={40} tilt={-10} style={{ position: 'absolute', right: 22, bottom: 16 }} />
      </View>

      {/* Big numbers ------------------------------------------------- */}
      <Spacer h={12} />
      <Row style={{ flexWrap: 'wrap', gap: 8 }}>
        {tiles.map((t) => (
          <View key={t.label} style={{ width: tileW, backgroundColor: t.bg, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' }}>
            <T style={{ fontFamily: font.display, fontSize: 26, color: t.fg }} numberOfLines={1} adjustsFontSizeToFit>
              {t.value}
            </T>
            <T v="caption" center color={t.fg} style={{ fontSize: 10.5 }}>
              {t.label}
            </T>
          </View>
        ))}
      </Row>

      {/* Cheers ------------------------------------------------------ */}
      {hype.cheers.length ? (
        <>
          <Spacer h={18} />
          <T v="over">Things to be proud of</T>
          <Spacer h={8} />
          <Card style={{ padding: 6 }}>
            {hype.cheers.map((c, i) => (
              <Row key={i} style={{ gap: 12, paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.lineSoft }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
                  <T style={{ fontSize: 18 }}>{c.emoji}</T>
                </View>
                <T v="body" color={colors.ink} style={{ flex: 1 }}>
                  {c.text}
                </T>
              </Row>
            ))}
          </Card>
        </>
      ) : null}

      <Spacer h={12} />
      <Row style={{ gap: 8 }}>
        <Btn style={{ flex: 1 }} small tone="quiet" icon="gift-outline" label="Your week, wrapped" onPress={() => router.push('/wrapped')} />
        <Btn style={{ flex: 1 }} small tone="quiet" icon="ribbon-outline" label="Achievements" onPress={() => router.push('/achievements')} />
      </Row>
      <Spacer h={6} />
      <Btn small tone="ghost" icon="stats-chart" label="Room by room insights" onPress={() => router.push('/insights')} />

      <Spacer h={14} />
      <T v="over">Your wins, day by day</T>
      <Spacer h={20} />
      {!byDay.length ? (
        <Card soft style={{ padding: 20, alignItems: 'center' }}>
          <T style={{ fontSize: 30 }}>{'\u{1F4C5}'}</T>
          <Spacer h={8} />
          <T v="heading" center>
            Your first win is waiting
          </T>
          <Spacer h={6} />
          <T v="body" center>
            Tick a chore off or cook something, and it lands here with a little cheer.
          </T>
        </Card>
      ) : (
        shown.map(([day, list]) => {
          const d = fromDayKey(day);
          const chores = list.flatMap((e) => (e.kind === 'chore' ? [e.c] : []));
          const minutes = Math.round(chores.reduce((s, c) => s + creditedMinutes(c, tasks), 0));
          return (
            <View key={day} style={{ marginBottom: 16 }}>
              <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <T v="over">
                  {day === today
                    ? 'Today'
                    : lastDoneLabel(d.toISOString()) === 'Yesterday'
                      ? 'Yesterday'
                      : `${weekdayLong(d)} · ${d.getDate()} ${monthShort(d)}`}
                </T>
                <T v="caption" color={colors.coralDeep}>
                  {list.length} {list.length === 1 ? 'win' : 'wins'}
                  {minutes ? ` · ${minutes} min` : ''} ✨
                </T>
              </Row>
              <Card style={{ padding: 4 }}>
                {list.map((e, i) => {
                  if (e.kind === 'cooked') {
                    return (
                      <Press
                        key={e.id}
                        onPress={() => router.push(`/recipe/${e.recipeId}`)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.lineSoft }}
                      >
                        <T style={{ width: 40, fontFamily: font.semi, fontSize: 12, color: colors.inkMuted }}>
                          {clockTime(new Date(e.at))}
                        </T>
                        <View style={{ width: 26, height: 26, borderRadius: radius.pill, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="restaurant" size={13} color={colors.goldDeep} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <T v="body" color={colors.ink} numberOfLines={1}>
                            Cooked {e.name}
                          </T>
                          <T v="caption">Yum!</T>
                        </View>
                      </Press>
                    );
                  }
                  const c = e.c;
                  const room = roomById.get(c.roomId);
                  return (
                    <Row
                      key={c.id}
                      style={{
                        gap: 10,
                        paddingVertical: 9,
                        paddingHorizontal: 10,
                        borderTopWidth: i ? 1 : 0,
                        borderTopColor: colors.lineSoft,
                      }}
                    >
                      <T
                        style={{
                          width: 40,
                          fontFamily: font.semi,
                          fontSize: 12,
                          color: colors.inkMuted,
                        }}
                      >
                        {clockTime(new Date(c.at))}
                      </T>
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: radius.pill,
                          backgroundColor: (room?.color ?? colors.sage) + '33',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={sourceIcon[c.source]} size={13} color={colors.espresso} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <T v="body" color={colors.ink} numberOfLines={1}>
                          {c.taskName}
                        </T>
                        <T v="caption" numberOfLines={1}>
                          {room ? `${room.emoji} ${room.name}` : 'A room you moved out of'} ·{' '}
                          {Math.round(creditedMinutes(c, tasks))} min
                        </T>
                      </View>
                      {c.coins ? (
                        <Row style={{ gap: 3 }}>
                          <Ionicons name="ellipse" size={8} color={colors.gold} />
                          <T v="caption">{c.coins}</T>
                        </Row>
                      ) : null}
                    </Row>
                  );
                })}
              </Card>
            </View>
          );
        })
      )}

      {byDay.length > days ? (
        <Btn small tone="ghost" label="Show older days" onPress={() => setDays((n) => n + PAGE)} />
      ) : null}
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card style={{ flex: 1, padding: 12, alignItems: 'center' }}>
      <T style={{ fontFamily: font.display, fontSize: 24, color: colors.ink }}>{value}</T>
      <T v="caption" center style={{ fontSize: 10.5 }}>
        {label}
      </T>
    </Card>
  );
}
