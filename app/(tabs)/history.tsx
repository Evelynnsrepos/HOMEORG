import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { clockTime, dayKey, fromDayKey, lastDoneLabel, monthShort, weekdayLong } from '../../src/lib/date';
import { creditedMinutes } from '../../src/lib/engine';
import type { Completion } from '../../src/lib/types';
import { useStats } from '../../src/state/derived';
import { useStore } from '../../src/state/store';
import { colors, font, radius } from '../../src/theme';
import { Btn, Card, Press, Row, Screen, Spacer, T } from '../../src/ui/base';

const sourceIcon: Record<Completion['source'], keyof typeof Ionicons.glyphMap> = {
  tick: 'checkmark',
  focus: 'disc-outline',
  sprint: 'timer-outline',
  wheel: 'sync-outline',
  challenge: 'trophy-outline',
};

const PAGE = 14;

/** "What did I do and when": every finished chore, newest day first. */
export default function History() {
  const router = useRouter();
  const completions = useStore((s) => s.completions);
  const tasks = useStore((s) => s.tasks);
  const rooms = useStore((s) => s.rooms);
  const recipes = useStore((s) => s.recipes);
  const stats = useStats();
  const [days, setDays] = useState(PAGE);

  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  const byDay = useMemo(() => {
    const groups = new Map<string, Completion[]>();
    for (const c of [...completions].sort((a, b) => b.at.localeCompare(a.at))) {
      const k = dayKey(c.at);
      const g = groups.get(k);
      if (g) g.push(c);
      else groups.set(k, [c]);
    }
    return [...groups.entries()];
  }, [completions]);

  // a cooked dish only remembers its latest date, so this is "lately", not a log
  const cooked = useMemo(
    () =>
      recipes
        .filter((r) => r.lastCooked)
        .sort((a, b) => b.lastCooked!.localeCompare(a.lastCooked!))
        .slice(0, 5),
    [recipes],
  );

  const shown = byDay.slice(0, days);
  const today = dayKey();

  return (
    <Screen>
      <T v="display" style={{ fontSize: 30 }}>
        What you did
      </T>
      <Spacer h={4} />
      <T v="label">And when you did it.</T>

      <Spacer h={16} />
      <Row style={{ gap: 8 }}>
        <Stat value={`${stats.tasks}`} label="Chores this week" />
        <Stat value={`${stats.minutes}`} label="Minutes" />
        <Stat value={`${stats.streak}`} label="Day streak" />
      </Row>
      <Spacer h={10} />
      <Btn
        small
        tone="quiet"
        icon="stats-chart"
        label="Insights, room by room"
        onPress={() => router.push('/insights')}
      />

      {cooked.length ? (
        <>
          <Spacer h={20} />
          <T v="over">Cooked lately</T>
          <Spacer h={8} />
          <Card style={{ padding: 4 }}>
            {cooked.map((r, i) => (
              <Press
                key={r.id}
                onPress={() => router.push(`/recipe/${r.id}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 9,
                  paddingHorizontal: 10,
                  borderTopWidth: i ? 1 : 0,
                  borderTopColor: colors.lineSoft,
                }}
              >
                <Ionicons name="restaurant-outline" size={14} color={colors.inkSoft} />
                <T v="body" color={colors.ink} style={{ flex: 1 }} numberOfLines={1}>
                  {r.name}
                </T>
                <T v="caption">{lastDoneLabel(r.lastCooked)}</T>
              </Press>
            ))}
          </Card>
        </>
      ) : null}

      <Spacer h={20} />
      {!byDay.length ? (
        <Card soft style={{ padding: 20, alignItems: 'center' }}>
          <T style={{ fontSize: 30 }}>{'\u{1F4C5}'}</T>
          <Spacer h={8} />
          <T v="heading" center>
            Nothing done yet
          </T>
          <Spacer h={6} />
          <T v="body" center>
            Tick a chore off on Today and it lands here with the time you did it.
          </T>
        </Card>
      ) : (
        shown.map(([day, list]) => {
          const d = fromDayKey(day);
          const minutes = Math.round(list.reduce((s, c) => s + creditedMinutes(c, tasks), 0));
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
                <T v="caption">
                  {list.length} done · {minutes} min
                </T>
              </Row>
              <Card style={{ padding: 4 }}>
                {list.map((c, i) => {
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
