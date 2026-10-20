import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';

import { dayKey, fromDayKey, humanMinutes, weekdayShort } from '../src/lib/date';
import { useRooms, useStats } from '../src/state/derived';
import { useStore } from '../src/state/store';
import { band, bandColor, bandLabel, colors, font } from '../src/theme';
import { Bar, Card, Empty, IconBtn, Press, Row, Screen, Spacer, T } from '../src/ui/base';


export default function Insights() {
  const { width: W } = useWindowDimensions();
  const router = useRouter();
  const stats = useStats();
  const rooms = useRooms();
  const completions = useStore((s) => s.completions);
  const tasks = useStore((s) => s.tasks);
  const coins = useStore((s) => s.coins);

  const maxDay = Math.max(1, ...stats.byDay.map((d) => d.count));
  const maxHour = Math.max(1, ...stats.byHour);

  const mix = useMemo(() => {
    const out = { light: 0, medium: 0, deep: 0 };
    for (const c of completions) {
      const t = tasks.find((x) => x.id === c.taskId);
      if (t) out[t.effort]++;
    }
    const total = out.light + out.medium + out.deep || 1;
    return { ...out, total };
  }, [completions, tasks]);

  const neglect = useMemo(
    () => [...rooms].sort((a, b) => a.health - b.health).slice(0, 5),
    [rooms],
  );

  // The weekday you clean least is the one the house catches up with you on.
  const messiestDay = useMemo(() => {
    const doneByWeekday = Array(7).fill(0) as number[];
    for (const c of completions) doneByWeekday[new Date(c.at).getDay()]++;
    let worst = 0;
    for (let i = 1; i < 7; i++) if (doneByWeekday[i] < doneByWeekday[worst]) worst = i;
    return { index: worst };
  }, [completions]);

  const weeks = useMemo(() => {
    const set = new Set(completions.map((c) => dayKey(c.at)));
    const out: { key: string; active: boolean }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      out.push({ key: dayKey(d), active: set.has(dayKey(d)) });
    }
    return out;
  }, [completions]);

  const personality = useMemo(() => {
    if (completions.length < 5) return 'Still working you out';
    const hours = stats.byHour;
    const morning = hours.slice(5, 12).reduce((a, b) => a + b, 0);
    const afternoon = hours.slice(12, 18).reduce((a, b) => a + b, 0);
    const evening = hours.slice(18, 24).reduce((a, b) => a + b, 0);
    const top = Math.max(morning, afternoon, evening);
    const when = top === morning ? 'a morning' : top === afternoon ? 'an afternoon' : 'an evening';
    const heavy = mix.deep / mix.total > 0.25 ? 'deep-clean' : 'little-and-often';
    return `You're ${when} ${heavy} sort`;
  }, [completions, stats.byHour, mix]);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => router.back()} />
        <T v="heading">Insights</T>
        <View style={{ width: 38 }} />
      </Row>

      <Spacer h={10} />
      <T v="display" style={{ fontSize: 28 }}>
        What actually{'\n'}happened.
      </T>

      <Spacer h={16} />
      <Card style={{ padding: 16 }}>
        <T v="over">This week</T>
        <Spacer h={12} />
        <Row style={{ justifyContent: 'space-around' }}>
          <Big value={`${stats.tasks}`} label="Tasks completed" />
          <Big value={`${stats.minutes}`} label="Minutes cleaned" />
          <Big value={`${stats.streak}`} label="Day streak" />
        </Row>
        <Spacer h={16} />
        <Row style={{ alignItems: 'flex-end', gap: 6, height: 74 }}>
          {stats.byDay.map((d) => {
            const h = 10 + (d.count / maxDay) * 56;
            return (
              <View key={d.key} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                <View
                  style={{
                    width: '78%',
                    height: h,
                    borderRadius: 6,
                    backgroundColor: d.count ? colors.sage : colors.lineSoft,
                  }}
                />
                <T v="caption" style={{ fontSize: 9 }}>
                  {weekdayShort(fromDayKey(d.key)).charAt(0)}
                </T>
              </View>
            );
          })}
        </Row>
        <Spacer h={6} />
        <T v="caption">
          A rolling seven days, counted back from right now.
        </T>
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">Room health</T>
        <Spacer h={4} />
        <T v="caption">Dirtiest first.</T>
        <Spacer h={12} />
        {rooms.length === 0 ? (
          <Empty emoji={'\u{1F3E1}'} title="No rooms yet" />
        ) : (
          [...rooms]
            .sort((a, b) => a.health - b.health)
            .map(({ room, health }) => {
              const b = band(health);
              return (
                <View key={room.id} style={{ marginBottom: 12 }}>
                  <Row style={{ justifyContent: 'space-between', marginBottom: 5 }}>
                    <T v="label">
                      {room.emoji} {room.name}
                    </T>
                    <T v="caption" color={bandColor[b]}>
                      {health}% · {bandLabel[b]}
                    </T>
                  </Row>
                  <Bar pct={health} color={bandColor[b]} />
                </View>
              );
            })
        )}
      </Card>

      <Spacer h={14} />
      <Press onPress={() => router.push('/wrapped')}>
        <Card style={{ padding: 16 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T v="over">Weekly recap</T>
              <Spacer h={5} />
              <T v="heading">See this week wrapped up</T>
              <T v="caption">Monday to Sunday, the room you loved most, your best day.</T>
            </View>
            <T style={{ fontSize: 26 }}>{'\u{1F381}'}</T>
          </Row>
        </Card>
      </Press>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">Your bests</T>
        <Spacer h={12} />
        <Row style={{ justifyContent: 'space-around' }}>
          <Big value={`${stats.best.tasks}`} label="Tasks, all time" />
          <Big value={humanMinutes(stats.best.minutes)} label="Time cleaned" />
          <Big value={`${stats.best.streak}`} label="Longest streak" />
        </Row>
        <Spacer h={10} />
        <Row style={{ justifyContent: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold }} />
          <T v="caption">{coins} coins in the wallet</T>
        </Row>
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">When you clean</T>
        <Spacer h={4} />
        <T v="caption">{personality}.</T>
        <Spacer h={12} />
        <Row style={{ gap: 2, flexWrap: 'wrap' }}>
          {stats.byHour.map((n, h) => (
            <View
              key={h}
              style={{
                width: Math.floor((W - 32 - 32 - 46) / 24),
                height: 26,
                borderRadius: 3,
                backgroundColor:
                  n === 0 ? colors.lineSoft : shade(colors.sage, 0.25 + (n / maxHour) * 0.75),
              }}
            />
          ))}
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
          <T v="caption" style={{ fontSize: 9 }}>
            00
          </T>
          <T v="caption" style={{ fontSize: 9 }}>
            12
          </T>
          <T v="caption" style={{ fontSize: 9 }}>
            23
          </T>
        </Row>
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">Task mix</T>
        <Spacer h={12} />
        <View style={{ height: 14, borderRadius: 7, overflow: 'hidden', flexDirection: 'row' }}>
          <View style={{ flex: mix.light || 0.001, backgroundColor: colors.sage }} />
          <View style={{ flex: mix.medium || 0.001, backgroundColor: colors.noRush }} />
          <View style={{ flex: mix.deep || 0.001, backgroundColor: colors.needsLove }} />
        </View>
        <Spacer h={10} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Legend color={colors.sage} label={`Light ${mix.light}`} />
          <Legend color={colors.noRush} label={`Medium ${mix.medium}`} />
          <Legend color={colors.needsLove} label={`Deep ${mix.deep}`} />
        </Row>
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">Rooms you keep ghosting</T>
        <Spacer h={10} />
        {neglect.map(({ room, health }, i) => (
          <Row key={room.id} style={{ paddingVertical: 7, gap: 10 }}>
            <T v="heading" color={colors.inkMuted} style={{ width: 18 }}>
              {i + 1}
            </T>
            <T v="body" style={{ flex: 1 }}>
              {room.emoji} {room.name}
            </T>
            <T v="label" color={bandColor[band(health)]}>
              {health}%
            </T>
          </Row>
        ))}
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">Predicted messiest day</T>
        <Spacer h={8} />
        <T v="title">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
            messiestDay.index
          ]}
        </T>
        <Spacer h={4} />
        <T v="caption">
          It's the day you clean least often, so it's the day the house catches up with you.
        </T>
      </Card>

      <Spacer h={14} />
      <Card style={{ padding: 16 }}>
        <T v="over">Twelve weeks</T>
        <Spacer h={10} />
        <Row style={{ flexWrap: 'wrap', gap: 3 }}>
          {weeks.map((d) => (
            <View
              key={d.key}
              style={{
                width: Math.floor((W - 32 - 32 - 3 * 11) / 12),
                height: Math.floor((W - 32 - 32 - 3 * 11) / 12),
                borderRadius: 3,
                backgroundColor: d.active ? colors.sage : colors.lineSoft,
              }}
            />
          ))}
        </Row>
        <Spacer h={8} />
        <T v="caption">Every day you ticked something off.</T>
      </Card>

      <Spacer h={14} />
      <T v="caption" center>
        Minutes come from a real stopwatch when there was one — Focus and Sprints — and from your
        own estimate when there wasn't.
      </T>
    </Screen>
  );
}

function Big({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <T style={{ fontFamily: font.display, fontSize: 25, color: colors.ink }}>{value}</T>
      <T v="caption" center style={{ fontSize: 10 }}>
        {label}
      </T>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row style={{ gap: 5 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <T v="caption">{label}</T>
    </Row>
  );
}

/** Blend a hex colour toward the paper background. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number, base: number) => Math.round(base + (c - base) * amount);
  return `rgb(${mix(r, 239)}, ${mix(g, 231)}, ${mix(b, 215)})`;
}
