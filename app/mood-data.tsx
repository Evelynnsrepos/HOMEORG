import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { addDays, dayKey, fromDayKey, monthShort, weekdayShort } from '../src/lib/date';
import { PRESETS, SCALES, byDay, heatmapGrid, type Scales } from '../src/lib/mood';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Card, Chip, Empty, IconBtn, Row, Screen, Spacer, T } from '../src/ui/base';

type Metric = keyof Scales | 'activity';
const TINT: Record<Metric, string> = { mood: '#FF79B0', social: '#B48CF0', clean: '#3FBF8F', hobby: '#FFA63D', activity: '#5AA9FF' };
const WEEKS = 26;

/**
 * Everything you tracked, drawn: a grid of the last half year like a
 * GitHub contribution graph, the last month as lines, and a few gentle
 * patterns. It's information about you, for you — never a score.
 */
export default function MoodData() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const moods = useStore((s) => s.moods ?? []);
  const completions = useStore((s) => s.completions);
  const coinLog = useStore((s) => s.coinLog ?? []);
  const [metric, setMetric] = useState<Metric>('mood');

  const inner = Math.min(W, 520) - 32;
  const days = useMemo(() => byDay(moods), [moods]);

  // activity: how many things you did that day, chores and everything that paid coins
  const activity = useMemo(() => {
    const out = new Map<string, number>();
    for (const c of completions) out.set(dayKey(c.at), (out.get(dayKey(c.at)) ?? 0) + 1);
    for (const e of coinLog) if (e.source !== 'chore' && !e.source.startsWith('streak')) out.set(e.day, (out.get(e.day) ?? 0) + 1);
    return out;
  }, [completions, coinLog]);
  const maxActivity = Math.max(4, ...activity.values());

  const level = (day: string): number | null => {
    if (metric === 'activity') {
      const n = activity.get(day) ?? 0;
      return n ? Math.min(4, Math.ceil((n / maxActivity) * 4)) : 0;
    }
    const m = days.get(day);
    return m ? Math.min(4, Math.floor(m[metric] / 20.01) + 0) : null;
  };

  const grid = heatmapGrid(WEEKS);
  const cell = Math.floor((inner - 26) / WEEKS) - 2;

  // the last 30 days as lines
  const last30 = Array.from({ length: 30 }, (_, i) => dayKey(addDays(new Date(), i - 29)));
  const chartH = 140;
  const x = (i: number) => 8 + (i / 29) * (inner - 16 - 24);
  const y = (v: number) => 8 + (1 - v / 100) * (chartH - 16);

  // gentle patterns
  const entries = [...days.values()];
  const avg = (k: keyof Scales, list = entries) => (list.length ? Math.round(list.reduce((s, m) => s + m[k], 0) / list.length) : 0);
  const choresOn = (pred: (m: (typeof entries)[number]) => boolean) => {
    const list = entries.filter(pred);
    if (!list.length) return null;
    return list.reduce((s, m) => s + completions.filter((c) => dayKey(c.at) === m.day).length, 0) / list.length;
  };
  const highClean = choresOn((m) => m.clean >= 60);
  const lowClean = choresOn((m) => m.clean < 40);
  const byWeekday = Array.from({ length: 7 }, (_, d) => {
    const list = entries.filter((m) => fromDayKey(m.day).getDay() === (d + 1) % 7);
    return { d, n: list.length, mood: avg('mood', list) };
  });
  const bestDay = [...byWeekday].filter((w) => w.n).sort((a, b) => b.mood - a.mood)[0];
  const presetCounts = PRESETS.map((p) => ({ ...p, n: entries.filter((m) => m.preset === p.id).length }));

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => router.back()} />
        <T v="heading">Your data</T>
        <View style={{ width: 38 }} />
      </Row>
      <Spacer h={6} />
      <T v="display" style={{ fontSize: 28 }}>
        What you tracked
      </T>
      <T v="label">Only on this phone, only for you.</T>

      <Spacer h={14} />
      <Row style={{ flexWrap: 'wrap', gap: 6 }}>
        {[...SCALES.map((s) => ({ id: s.key as Metric, label: `${s.emoji} ${s.key === 'social' ? 'People' : s.key === 'clean' ? 'Cleaning' : s.key === 'hobby' ? 'Hobbies' : 'Mood'}` })), { id: 'activity' as Metric, label: '✨ Activity' }].map((m) => (
          <Chip key={m.id} small label={m.label} active={metric === m.id} tone={TINT[m.id]} onPress={() => setMetric(m.id)} />
        ))}
      </Row>

      {/* the contribution grid -------------------------------------------- */}
      <Spacer h={12} />
      <Card style={{ padding: 12 }}>
        <Svg width={inner - 24} height={7 * (cell + 2) + 16}>
          {grid.map((col, w) => {
            const first = col[0];
            const showMonth = first && (w === 0 || fromDayKey(first).getDate() <= 7);
            return (
              <React.Fragment key={w}>
                {showMonth ? (
                  <SvgText x={22 + w * (cell + 2)} y={9} fontSize={8} fill={colors.inkMuted} fontFamily={font.medium}>
                    {monthShort(fromDayKey(first!))}
                  </SvgText>
                ) : null}
                {col.map((day, d) => {
                  if (!day) return null;
                  const lv = level(day);
                  return (
                    <Rect
                      key={d}
                      x={22 + w * (cell + 2)}
                      y={14 + d * (cell + 2)}
                      width={cell}
                      height={cell}
                      rx={2.5}
                      fill={lv == null ? colors.cardAlt : TINT[metric]}
                      opacity={lv == null ? 1 : 0.18 + lv * 0.2}
                      stroke={day === dayKey() ? colors.ink : 'none'}
                      strokeWidth={1}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
          {['Mon', 'Wed', 'Fri'].map((l, i) => (
            <SvgText key={l} x={0} y={14 + (i * 2) * (cell + 2) + cell - 1} fontSize={8} fill={colors.inkMuted} fontFamily={font.medium}>
              {l}
            </SvgText>
          ))}
        </Svg>
        <Row style={{ justifyContent: 'flex-end', gap: 4, marginTop: 6 }}>
          <T v="caption" style={{ fontSize: 10 }}>
            {metric === 'activity' ? 'less' : 'low'}
          </T>
          {[0, 1, 2, 3, 4].map((lv) => (
            <View key={lv} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: TINT[metric], opacity: 0.18 + lv * 0.2 }} />
          ))}
          <T v="caption" style={{ fontSize: 10 }}>
            {metric === 'activity' ? 'more' : 'high'}
          </T>
        </Row>
      </Card>

      {!entries.length ? (
        <>
          <Spacer h={10} />
          <Empty
            emoji="🌱"
            title="Nothing tracked yet"
            body="Check in on Home with one tap. After a few days, patterns start to show up here."
          />
        </>
      ) : (
        <>
          {/* the last month ------------------------------------------------ */}
          <Spacer h={16} />
          <T v="over">The last 30 days</T>
          <Spacer h={8} />
          <Card style={{ padding: 12 }}>
            <Svg width={inner - 24} height={chartH}>
              {[0, 50, 100].map((v) => (
                <Line key={v} x1={8} x2={inner - 40} y1={y(v)} y2={y(v)} stroke={colors.lineSoft} strokeWidth={1} />
              ))}
              {SCALES.map((s) => {
                const pts = last30
                  .map((d, i) => (days.get(d) ? `${x(i)},${y(days.get(d)![s.key])}` : null))
                  .filter(Boolean)
                  .join(' ');
                return (
                  <React.Fragment key={s.key}>
                    <Polyline points={pts} fill="none" stroke={TINT[s.key]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                    {last30.map((d, i) =>
                      days.get(d) ? <Circle key={d} cx={x(i)} cy={y(days.get(d)![s.key])} r={2.5} fill={TINT[s.key]} /> : null,
                    )}
                  </React.Fragment>
                );
              })}
            </Svg>
            <Row style={{ flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
              {SCALES.map((s) => (
                <Row key={s.key} style={{ gap: 4 }}>
                  <View style={{ width: 10, height: 3, borderRadius: 2, backgroundColor: TINT[s.key] }} />
                  <T v="caption" style={{ fontSize: 10.5 }}>
                    {s.label}
                  </T>
                </Row>
              ))}
            </Row>
          </Card>

          {/* by weekday ------------------------------------------------------ */}
          <Spacer h={16} />
          <T v="over">Mood by weekday</T>
          <Spacer h={8} />
          <Card style={{ padding: 12 }}>
            <Row style={{ alignItems: 'flex-end', gap: 6, height: 90 }}>
              {byWeekday.map((w) => (
                <View key={w.d} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View
                    style={{
                      width: '70%',
                      height: w.n ? Math.max(6, (w.mood / 100) * 64) : 4,
                      borderRadius: 6,
                      backgroundColor: w.n ? TINT.mood : colors.cardAlt,
                      opacity: w.n ? 0.85 : 1,
                    }}
                  />
                  <T v="caption" style={{ fontSize: 10 }}>
                    {weekdayShort(addDays(fromDayKey('2026-01-05'), w.d))}
                  </T>
                </View>
              ))}
            </Row>
          </Card>

          {/* gentle patterns ------------------------------------------------ */}
          <Spacer h={16} />
          <T v="over">Patterns, gently</T>
          <Spacer h={8} />
          <Card style={{ padding: 6 }}>
            {[
              `${entries.length} ${entries.length === 1 ? 'check-in' : 'check-ins'} so far. Every one is you paying attention to yourself.`,
              `On average: mood ${avg('mood')}, room for people ${avg('social')}, cleaning energy ${avg('clean')}, hobby energy ${avg('hobby')}.`,
              bestDay ? `${weekdayLongOf(bestDay.d)}s tend to feel best.` : null,
              highClean != null && lowClean != null
                ? `With lots of cleaning energy you did about ${highClean.toFixed(1)} chores; on low days about ${lowClean.toFixed(1)}. Both are exactly right for those days.`
                : null,
            ]
              .filter((l): l is string => !!l)
              .map((l, i) => (
                <T key={i} v="body" color={colors.ink} style={{ padding: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.lineSoft }}>
                  {l}
                </T>
              ))}
          </Card>

          <Spacer h={12} />
          <Row style={{ gap: 6, flexWrap: 'wrap' }}>
            {presetCounts.map((p) => (
              <View
                key={p.id}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.card }}
              >
                <T style={{ fontSize: 14 }}>{p.emoji}</T>
                <T v="caption" color={colors.ink}>
                  {p.label} · {p.n}
                </T>
              </View>
            ))}
          </Row>
        </>
      )}
    </Screen>
  );
}

function weekdayLongOf(d: number): string {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][d];
}
