import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { breakDown, grainLabel, type Grain } from '../src/data/breakdown';
import { clockTime, mmss } from '../src/lib/date';
import { coinsForEffort, effortLabel } from '../src/lib/engine';
import type { Task } from '../src/lib/types';
import { useEnergyCounts, useFocusQueue } from '../src/state/derived';
import { useMusic } from '../src/state/music';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Btn, Card, Chip, EmojiTile, IconBtn, Press, Row, Spacer, T, tap, tapSuccess } from '../src/ui/base';
import { Confetti } from '../src/ui/Confetti';
import { MiniPlayer } from '../src/ui/MiniPlayer';

type Energy = 'low' | 'medium' | 'high';
type Stage = 'energy' | 'task' | 'breathe' | 'done';

export default function Focus() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string; roomId?: string }>();

  const rooms = useStore((s) => s.rooms);
  const allTasks = useStore((s) => s.tasks);
  const completeTask = useStore((s) => s.completeTask);
  const useBreakdownSlot = useStore((s) => s.useBreakdown);
  const setLastWheelTask = useStore((s) => s.setLastWheelTask);

  const [energy, setEnergy] = useState<Energy>('medium');
  const [groupByRooms, setGroupByRooms] = useState(true);
  const [stage, setStage] = useState<Stage>(params.taskId ? 'task' : 'energy');
  const [cursor, setCursor] = useState(0);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [lastCoins, setLastCoins] = useState(0);

  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startedRef = useRef<number | null>(null);

  const [steps, setSteps] = useState<string[] | null>(null);
  const [stepsDone, setStepsDone] = useState<string[]>([]);
  const [grain, setGrain] = useState<Grain>('medium');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const rawQueue = useFocusQueue(energy, params.roomId);
  const counts = useEnergyCounts(params.roomId);

  // Music comes on once a task is really on screen, and goes off when you
  // leave. An empty queue means there is nothing to clean to, so it stays off.
  const musicEnter = useMusic((s) => s.screenEnter);
  const musicLeave = useMusic((s) => s.screenLeave);
  const hasQueue = rawQueue.length > 0;
  useEffect(() => {
    if (stage === 'task' && hasQueue) musicEnter();
  }, [stage, hasQueue, musicEnter]);
  useEffect(() => musicLeave, [musicLeave]);

  const queue = useMemo(() => {
    let list = rawQueue.filter((t) => !skipped.includes(t.id) && !doneIds.includes(t.id));
    if (groupByRooms) {
      const order = new Map<string, number>();
      rooms.forEach((r, i) => order.set(r.id, i));
      list = [...list].sort((a, b) => (order.get(a.roomId) ?? 99) - (order.get(b.roomId) ?? 99));
    }
    // A task you arrived on from the wheel or a celebration always starts,
    // even if the energy filter or the daily cap would have left it out.
    if (params.taskId) {
      const pinned =
        list.find((t) => t.id === params.taskId) ?? allTasks.find((t) => t.id === params.taskId);
      if (pinned) list = [pinned, ...list.filter((t) => t.id !== pinned.id)];
    }
    return list;
  }, [rawQueue, skipped, doneIds, groupByRooms, rooms, allTasks, params.taskId]);

  const task: Task | undefined = queue[Math.min(cursor, Math.max(0, queue.length - 1))];
  const room = rooms.find((r) => r.id === task?.roomId);
  const estimate = (task?.minutes ?? 5) * 60;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= estimate) {
          // The timer never completes anything by itself — it just stops.
          setRunning(false);
          return estimate;
        }
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, estimate]);

  function resetTimer() {
    setRunning(false);
    setSeconds(0);
    startedRef.current = null;
    setSteps(null);
    setStepsDone([]);
    setShowBreakdown(false);
  }

  function finish() {
    if (!task) return;
    tapSuccess();
    const recorded = Math.min(seconds / 60, task.minutes);
    const coins = completeTask(task.id, {
      minutes: seconds > 0 ? recorded : null,
      source: 'focus',
    });
    setLastCoins(coins);
    setDoneIds((d) => [...d, task.id]);
    resetTimer();
    setStage('done');
  }

  function skip() {
    if (!task || queue.length <= 1) return;
    tap();
    setSkipped((s) => [...s, task.id]);
    resetTimer();
  }

  function spin() {
    if (queue.length < 2) return;
    tap();
    const pick = queue[Math.floor(Math.random() * queue.length)];
    setLastWheelTask(pick.id);
    setCursor(queue.indexOf(pick));
    resetTimer();
  }

  const finishBy = useMemo(() => {
    const total = queue.reduce((s, t) => s + t.minutes, 0);
    return clockTime(new Date(Date.now() + total * 60_000));
  }, [queue]);

  /* ---------------------------------------------------------------- */

  if (stage === 'energy') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 8 }}>
        <Row style={{ paddingHorizontal: 16 }}>
          <IconBtn name="close" onPress={() => router.back()} />
        </Row>
        <ScrollView contentContainerStyle={{ padding: 22 }}>
          <T v="over">Focus mode</T>
          <Spacer h={8} />
          <T v="display" style={{ fontSize: 30, lineHeight: 34 }}>
            How much have you{'\n'}got in you?
          </T>
          <Spacer h={8} />
          <T v="body">
            One task at a time. No list, no scrolling, no shame.
            {params.roomId
              ? ` Just the ${rooms.find((r) => r.id === params.roomId)?.name ?? 'room'} for now.`
              : ''}
          </T>
          <Spacer h={22} />

          {(
            [
              ['low', '\u{1F331}', 'Low', 'Quick & easy tasks only'],
              ['medium', '\u{1F33F}', 'Medium', 'Light and medium tasks'],
              ['high', '\u{1F333}', 'High', 'Bring on the deep cleans'],
            ] as const
          ).map(([id, emoji, label, hint]) => {
            const n = counts[id];
            return (
              <Pressable
                key={id}
                onPress={() => {
                  if (!n) return;
                  tap();
                  setEnergy(id);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 13,
                  backgroundColor: energy === id ? colors.sageSoft : colors.card,
                  borderWidth: 1.5,
                  borderColor: energy === id ? colors.sage : colors.lineSoft,
                  borderRadius: radius.lg,
                  padding: 15,
                  marginBottom: 10,
                  opacity: n ? 1 : 0.45,
                }}
              >
                <EmojiTile emoji={emoji} size={40} bg={colors.bgDeep} />
                <View style={{ flex: 1 }}>
                  <T v="heading">{label}</T>
                  <T v="caption">{hint}</T>
                </View>
                <T v="label" color={n ? colors.inkMuted : colors.line}>
                  {n}
                </T>
                {energy === id && n ? (
                  <Ionicons name="checkmark-circle" size={21} color={colors.sage} />
                ) : null}
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => {
              tap();
              setEnergy('high');
              setStage('task');
            }}
            style={{ paddingVertical: 12 }}
          >
            <T v="label" center color={colors.coralDeep}>
              Not sure — just pick for me
            </T>
          </Pressable>

          <Spacer h={10} />
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <T v="heading" style={{ fontSize: 14 }}>
                Group by rooms
              </T>
              <T v="caption">Finish one room before moving on</T>
            </View>
            <Chip
              label={groupByRooms ? 'On' : 'Off'}
              active={groupByRooms}
              onPress={() => setGroupByRooms((v) => !v)}
            />
          </Row>

          <Spacer h={22} />
          <Btn
            label={queue.length ? `Start — ${queue.length} in the queue` : 'Nothing at this level'}
            disabled={!queue.length}
            onPress={() => setStage('task')}
          />
          {!queue.length ? (
            <>
              <Spacer h={10} />
              <T v="caption" center>
                Nothing matches that energy level right now. Try a higher one, or enjoy the quiet.
              </T>
            </>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  if (stage === 'breathe') {
    return <Breathe onDone={() => setStage('task')} />;
  }

  if (stage === 'done') {
    const next = queue[0];
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
        <Confetti trigger={doneIds.length} spread={230} />
        <T v="display" center style={{ fontSize: 44 }}>
          {'\u{2728}'}
        </T>
        <Spacer h={10} />
        <T v="display" center style={{ fontSize: 28 }}>
          That's done.
        </T>
        <Spacer h={8} />
        <T v="body" center>
          +{lastCoins} coins in your wallet.
        </T>
        <Spacer h={26} />
        {next ? (
          <Card>
            <T v="over">Next up</T>
            <Spacer h={6} />
            <T v="heading">{next.name}</T>
            <T v="caption">
              {rooms.find((r) => r.id === next.roomId)?.name} · {next.minutes} min
            </T>
            <Spacer h={14} />
            <Btn
              label="Let's do it"
              onPress={() => {
                setCursor(0);
                setStage('task');
              }}
            />
          </Card>
        ) : (
          <Card soft>
            <T v="heading" center>
              Queue is empty
            </T>
            <Spacer h={4} />
            <T v="body" center>
              That's everything on today's list. Go and sit down.
            </T>
          </Card>
        )}
        <Spacer h={12} />
        <Btn label="Back to tasks" tone="quiet" onPress={() => router.back()} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 22, justifyContent: 'center' }}>
        <T v="display" center style={{ fontSize: 30 }}>
          All clear.
        </T>
        <Spacer h={8} />
        <T v="body" center>
          Nothing left in the focus queue.
        </T>
        <Spacer h={20} />
        <Btn label="Back" tone="quiet" onPress={() => router.back()} />
      </View>
    );
  }

  /* ---- The task screen -------------------------------------------- */

  const remaining = queue.length - 1;
  const allStepsDone = steps ? stepsDone.length >= steps.length : false;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 4 }}>
      <Row style={{ paddingHorizontal: 12, justifyContent: 'space-between' }}>
        <IconBtn name="close" onPress={() => router.back()} />
        <T v="over">Focus</T>
        <IconBtn name="options-outline" onPress={() => setStage('energy')} />
      </Row>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 30 }}>
        <Row style={{ gap: 10 }}>
          <EmojiTile emoji={room?.emoji ?? '\u{2728}'} size={40} bg={colors.cardAlt} />
          <T v="over" color={room?.color}>
            {room?.name}
          </T>
        </Row>

        <Spacer h={14} />
        <T v="display" style={{ fontSize: 32, lineHeight: 37 }}>
          {task.name}
        </T>

        <Spacer h={14} />
        <Row style={{ gap: 7 }}>
          <MetaPill text={effortLabel[task.effort]} />
          <MetaPill text={`${task.minutes} min`} />
          <MetaPill text={`${coinsForEffort[task.effort]} coins`} tint={colors.gold} />
        </Row>

        <Spacer h={20} />

        {!running && seconds === 0 ? (
          <Btn label="Let's go" icon="play" onPress={() => {
            startedRef.current = Date.now();
            setRunning(true);
          }} />
        ) : (
          <View
            style={{
              backgroundColor: colors.espresso,
              borderRadius: radius.xl,
              padding: 20,
              alignItems: 'center',
            }}
          >
            <T
              style={{
                fontFamily: font.display,
                fontSize: 46,
                color: colors.onDark,
                letterSpacing: 1,
              }}
            >
              {mmss(seconds)}
            </T>
            <T v="caption" color="#B9AE9A">
              of {mmss(estimate)}
            </T>
            <Spacer h={14} />
            <Row style={{ gap: 10 }}>
              <Btn
                label={running ? 'Pause' : 'Resume'}
                tone="quiet"
                small
                full={false}
                onPress={() => setRunning((r) => !r)}
              />
              <Btn
                label={allStepsDone && steps ? 'Mark task done' : 'Done!'}
                icon="sparkles"
                small
                full={false}
                onPress={finish}
              />
            </Row>
          </View>
        )}

        {/* Breakdown ------------------------------------------------ */}
        {steps ? (
          <>
            <Spacer h={18} />
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="over">Steps</T>
                <T v="caption">
                  {stepsDone.length}/{steps.length}
                </T>
              </Row>
              <Spacer h={8} />
              {steps.map((s, i) => {
                const done = stepsDone.includes(s);
                return (
                  <Pressable
                    key={`${s}-${i}`}
                    onPress={() => {
                      tapSuccess();
                      setStepsDone((d) => (d.includes(s) ? d.filter((x) => x !== s) : [...d, s]));
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 9,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: done ? colors.sage : colors.line,
                        backgroundColor: done ? colors.sage : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {done ? <Ionicons name="checkmark" size={12} color="#FFF" /> : null}
                    </View>
                    <T
                      v="body"
                      style={{
                        flex: 1,
                        textDecorationLine: done ? 'line-through' : 'none',
                        color: done ? colors.inkMuted : colors.inkSoft,
                      }}
                    >
                      {s}
                    </T>
                  </Pressable>
                );
              })}
            </Card>
          </>
        ) : null}

        {showBreakdown && !steps ? (
          <>
            <Spacer h={18} />
            <Card>
              <T v="over">How fine do you want it?</T>
              <Spacer h={10} />
              <Row style={{ gap: 7 }}>
                {(['simple', 'medium', 'micro'] as Grain[]).map((g) => (
                  <Chip
                    key={g}
                    small
                    label={grainLabel[g]}
                    active={grain === g}
                    onPress={() => setGrain(g)}
                  />
                ))}
              </Row>
              <Spacer h={14} />
              <Btn
                label="Break it down"
                icon="hammer-outline"
                tone="sage"
                onPress={() => {
                  if (!useBreakdownSlot()) return;
                  setSteps(breakDown(task.name, grain));
                }}
              />
            </Card>
          </>
        ) : null}

        <Spacer h={18} />
        <Row style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {!steps ? (
            <Chip
              small
              icon="sparkles"
              label="Break it down"
              onPress={() => setShowBreakdown((v) => !v)}
            />
          ) : null}
          {remaining > 0 ? (
            <Chip small icon="arrow-redo-outline" label="Skip this one" onPress={skip} />
          ) : null}
          {remaining > 0 ? (
            <Chip small icon="disc-outline" label="Spin the wheel" onPress={spin} />
          ) : null}
          <Chip
            small
            icon="leaf-outline"
            label="I need a break"
            onPress={() => {
              setRunning(false);
              setStage('breathe');
            }}
          />
        </Row>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 22,
          paddingBottom: insets.bottom + 12,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: colors.lineSoft,
          gap: 10,
        }}
      >
        <MiniPlayer />
        <T v="caption" center>
          {remaining === 0
            ? 'Last one in the queue'
            : `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left — done by ${finishBy}`}
        </T>
      </View>
    </View>
  );
}

function MetaPill({ text, tint = colors.inkSoft }: { text: string; tint?: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.cardAlt,
        borderRadius: radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <T v="label" style={{ fontSize: 12 }} color={tint}>
        {text}
      </T>
    </View>
  );
}

/** 4-7-8: four seconds in, seven holding, eight out. */
function Breathe({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [left, setLeft] = useState(4);

  useEffect(() => {
    const t = setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        setPhase((p) => (p === 'in' ? 'hold' : p === 'hold' ? 'out' : 'in'));
        return 0;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setLeft(phase === 'in' ? 4 : phase === 'hold' ? 7 : 8);
  }, [phase]);

  const size = phase === 'in' ? 200 : phase === 'hold' ? 200 : 130;
  const label = phase === 'in' ? 'Breathe in' : phase === 'hold' ? 'Hold' : 'Breathe out';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.espresso,
        paddingTop: insets.top,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <T v="over" color="#B9AE9A">
        Breathe · 4-7-8
      </T>
      <Spacer h={40} />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#3B322C',
          borderWidth: 2,
          borderColor: colors.sage,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <T style={{ fontFamily: font.display, fontSize: 46, color: colors.onDark }}>{left}</T>
      </View>
      <Spacer h={30} />
      <T v="title" color={colors.onDark}>
        {label}
      </T>
      <Spacer h={40} />
      <Press onPress={onDone} style={{ padding: 14 }}>
        <T v="heading" color={colors.coral}>
          I'm ready
        </T>
      </Press>
    </View>
  );
}
