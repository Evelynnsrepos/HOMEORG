import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mmss } from '../src/lib/date';
import { priority } from '../src/lib/engine';
import type { Task } from '../src/lib/types';
import { useMusic } from '../src/state/music';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Bar, Btn, Card, Chip, Empty, IconBtn, Row, Spacer, T, tap, tapSuccess } from '../src/ui/base';
import { MiniPlayer } from '../src/ui/MiniPlayer';
import { Check } from '../src/ui/TaskRow';

type Stage = 'setup' | 'pick' | 'live' | 'over';

export default function Sprint() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Home's "Focus now?" boxes hand over a length so the timer is already set
  const params = useLocalSearchParams<{ minutes?: string }>();

  const allTasks = useStore((s) => s.tasks);
  const rooms = useStore((s) => s.rooms);
  const completeTask = useStore((s) => s.completeTask);
  const recordSprint = useStore((s) => s.recordSprint);

  const [stage, setStage] = useState<Stage>('setup');
  const [minutes, setMinutes] = useState(() => Number(params.minutes) || 25);
  const [selected, setSelected] = useState<string[]>([]);
  const [left, setLeft] = useState(0);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [coins, setCoins] = useState(0);
  const lastTick = useRef<number>(0);
  const musicEnter = useMusic((s) => s.screenEnter);
  const musicLeave = useMusic((s) => s.screenLeave);
  const startedAt = useRef<string>('');

  // A sprint ignores the daily cap and can pull in anything that has decayed.
  const candidates = useMemo(
    () =>
      [...allTasks]
        .filter((t) => t.kind !== 'once' || !t.doneOnce)
        .sort((a, b) => priority(b) - priority(a))
        .slice(0, 40),
    [allTasks],
  );

  const chosen = useMemo(
    () => candidates.filter((t) => selected.includes(t.id)),
    [candidates, selected],
  );

  // The bell can ring at any moment, so the timer reaches for the newest `end`
  // rather than the one captured when the sprint started.
  const endRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (stage === 'live') musicEnter();
  }, [stage, musicEnter]);

  useEffect(() => musicLeave, [musicLeave]);

  useEffect(() => {
    if (stage !== 'live') return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          tapSuccess();
          endRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [stage]);

  function begin(list: Task[]) {
    if (!list.length) return;
    setSelected(list.map((t) => t.id));
    setLeft(minutes * 60);
    setDoneIds([]);
    setCoins(0);
    lastTick.current = Date.now();
    startedAt.current = new Date().toISOString();
    setStage('live');
  }

  function tick(t: Task) {
    if (doneIds.includes(t.id)) return;
    tapSuccess();
    // Sprint credits the real gap since your last tick, to the second.
    const gap = (Date.now() - lastTick.current) / 60_000;
    lastTick.current = Date.now();
    const earned = completeTask(t.id, { minutes: gap, source: 'sprint' });
    setCoins((c) => c + earned);
    setDoneIds((d) => [...d, t.id]);
  }

  function end() {
    recordSprint({
      startedAt: startedAt.current,
      minutes: minutes - Math.ceil(left / 60),
      taskIds: selected,
      completed: doneIds.length,
      coins,
    });
    setStage('over');
  }
  endRef.current = end;

  /* ---- Setup ------------------------------------------------------ */
  if (stage === 'setup') {
    const quick = candidates.slice(0, 8);
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 6 }}>
        <Row style={{ paddingHorizontal: 12 }}>
          <IconBtn name="close" onPress={() => router.back()} />
        </Row>
        <ScrollView contentContainerStyle={{ padding: 22 }}>
          <T v="over">Cleaning sprint</T>
          <Spacer h={8} />
          <T v="display" style={{ fontSize: 30, lineHeight: 34 }}>
            A short timer,{'\n'}a clear stop.
          </T>
          <Spacer h={8} />
          <T v="body">
            Pick a length, tick tasks off in any order, and stop when the bell goes. The timer is
            the body double.
          </T>

          <Spacer h={22} />
          <T v="over">How long</T>
          <Spacer h={9} />
          <Row style={{ gap: 8 }}>
            {[15, 25, 45].map((m) => (
              <Chip key={m} label={`${m} min`} active={minutes === m} onPress={() => setMinutes(m)} />
            ))}
          </Row>

          <Spacer h={24} />
          <Btn label={`Start with the top ${Math.min(8, quick.length)}`} onPress={() => begin(quick)} />
          <Spacer h={10} />
          <Btn label="Choose tasks" tone="quiet" onPress={() => setStage('pick')} />
        </ScrollView>
      </View>
    );
  }

  /* ---- Choose tasks ----------------------------------------------- */
  if (stage === 'pick') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 6 }}>
        <Row style={{ paddingHorizontal: 12, justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => setStage('setup')} />
          <T v="heading">Choose tasks</T>
          <View style={{ width: 38 }} />
        </Row>
        <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 8 }}>
          <T v="caption">
            A sprint ignores the daily budget — pick anything you fancy.
          </T>
          <Spacer h={12} />
          {rooms.map((room) => {
            const list = candidates.filter((t) => t.roomId === room.id);
            if (!list.length) return null;
            return (
              <View key={room.id}>
                <Row style={{ gap: 7, marginTop: 14, marginBottom: 4 }}>
                  <View
                    style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: room.color }}
                  />
                  <T v="over" color={room.color}>
                    {room.name}
                  </T>
                </Row>
                {list.map((t) => (
                  <Row key={t.id} style={{ paddingVertical: 9, gap: 12 }}>
                    <Check
                      done={selected.includes(t.id)}
                      color={room.color}
                      onPress={() => {
                        tap();
                        setSelected((s) =>
                          s.includes(t.id) ? s.filter((x) => x !== t.id) : [...s, t.id],
                        );
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <T v="heading" style={{ fontSize: 14 }}>
                        {t.name}
                      </T>
                      <T v="caption">{t.minutes} min</T>
                    </View>
                  </Row>
                ))}
              </View>
            );
          })}
        </ScrollView>
        <View
          style={{
            padding: 20,
            paddingBottom: insets.bottom + 14,
            borderTopWidth: 1,
            borderTopColor: colors.lineSoft,
          }}
        >
          <Btn
            label={`Start sprint · ${chosen.length} selected`}
            disabled={!chosen.length}
            onPress={() => begin(chosen)}
          />
        </View>
      </View>
    );
  }

  /* ---- Results ---------------------------------------------------- */
  if (stage === 'over') {
    const totalMin = chosen
      .filter((t) => doneIds.includes(t.id))
      .reduce((s, t) => s + t.minutes, 0);
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: insets.top,
          padding: 22,
          justifyContent: 'center',
        }}
      >
        <T v="over" center color={colors.coralDeep}>
          Time's up
        </T>
        <Spacer h={10} />
        <T v="display" center style={{ fontSize: 34 }}>
          {doneIds.length} done.
        </T>
        <Spacer h={22} />
        <Card>
          <Row style={{ justifyContent: 'space-around' }}>
            <Stat value={`${doneIds.length}`} label="Tasks" />
            <Stat value={`${totalMin}`} label="Minutes" />
            <Stat value={`${coins}`} label="Coins" tint={colors.gold} />
          </Row>
        </Card>
        <Spacer h={20} />
        <Btn label="Done" onPress={() => router.back()} />
        <Spacer h={10} />
        <Btn
          label="Another sprint"
          tone="quiet"
          onPress={() => {
            setStage('setup');
            setSelected([]);
          }}
        />
      </View>
    );
  }

  /* ---- Live ------------------------------------------------------- */
  const remaining = chosen.filter((t) => !doneIds.includes(t.id));
  const pct = ((minutes * 60 - left) / (minutes * 60)) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 6 }}>
      <View style={{ paddingHorizontal: 20 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ gap: 7 }}>
            <View
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.sage }}
            />
            <T v="over">Sprint live</T>
          </Row>
          <Row style={{ gap: 8 }}>
            <Row
              style={{
                backgroundColor: colors.goldSoft,
                borderRadius: radius.pill,
                paddingHorizontal: 9,
                paddingVertical: 4,
                gap: 4,
              }}
            >
              <Ionicons name="ellipse" size={10} color={colors.gold} />
              <T v="label" style={{ fontSize: 12 }} color="#8A6B1F">
                {coins}
              </T>
            </Row>
            <Row
              style={{
                backgroundColor: colors.sageSoft,
                borderRadius: radius.pill,
                paddingHorizontal: 9,
                paddingVertical: 4,
                gap: 4,
              }}
            >
              <Ionicons name="checkmark" size={11} color={colors.sageDeep} />
              <T v="label" style={{ fontSize: 12 }} color={colors.sageDeep}>
                {doneIds.length}
              </T>
            </Row>
          </Row>
        </Row>

        <Spacer h={10} />
        <Row style={{ alignItems: 'flex-end', gap: 8 }}>
          <T style={{ fontFamily: font.display, fontSize: 48, color: colors.ink }}>{mmss(left)}</T>
          <T v="label" style={{ marginBottom: 9 }}>
            left
          </T>
        </Row>
        <Spacer h={8} />
        <Bar pct={pct} color={colors.sage} height={5} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }}>
        <T v="over" style={{ marginTop: 8 }}>
          {remaining.length} remaining
        </T>
        {rooms.map((room) => {
          const list = chosen.filter((t) => t.roomId === room.id);
          if (!list.length) return null;
          return (
            <View key={room.id}>
              <Row style={{ gap: 7, marginTop: 16, marginBottom: 2 }}>
                <View
                  style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: room.color }}
                />
                <T v="over" color={room.color}>
                  {room.name}
                </T>
              </Row>
              {list.map((t) => {
                const done = doneIds.includes(t.id);
                return (
                  <Row key={t.id} style={{ paddingVertical: 10, gap: 12, opacity: done ? 0.45 : 1 }}>
                    <Check done={done} color={room.color} onPress={() => tick(t)} />
                    <View style={{ flex: 1 }}>
                      <T
                        v="heading"
                        style={{
                          fontSize: 14,
                          textDecorationLine: done ? 'line-through' : 'none',
                        }}
                      >
                        {t.name}
                      </T>
                      <T v="caption">{t.minutes} min</T>
                    </View>
                  </Row>
                );
              })}
            </View>
          );
        })}
        {!chosen.length ? <Empty emoji={'\u{1F9F9}'} title="No tasks in this sprint" /> : null}
      </ScrollView>

      <View
        style={{
          padding: 20,
          paddingBottom: insets.bottom + 14,
          borderTopWidth: 1,
          borderTopColor: colors.lineSoft,
          gap: 10,
        }}
      >
        <MiniPlayer />
        <Btn label="End sprint" tone="quiet" onPress={end} />
      </View>
    </View>
  );
}

function Stat({ value, label, tint = colors.ink }: { value: string; label: string; tint?: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <T style={{ fontFamily: font.display, fontSize: 26, color: tint }}>{value}</T>
      <T v="caption">{label}</T>
    </View>
  );
}
