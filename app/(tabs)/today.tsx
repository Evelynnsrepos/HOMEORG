import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { dayKey, humanMinutes, monthShort, weekdayShort } from '../../src/lib/date';
import type { Task } from '../../src/lib/types';
import { useWeekPlan } from '../../src/state/derived';
import { useStore } from '../../src/state/store';
import { colors, radius } from '../../src/theme';
import { Bar, Btn, Card, Empty, Press, Row, Screen, Spacer, T, tap } from '../../src/ui/base';
import { Confetti } from '../../src/ui/Confetti';
import { GroupHeader, TaskRow, Toast } from '../../src/ui/TaskRow';
import { ScreenGarland } from '../../src/ui/Decor';

export default function TodayTab() {
  const router = useRouter();
  const week = useWeekPlan(7);
  const rooms = useStore((s) => s.rooms);
  const settings = useStore((s) => s.settings);
  const completions = useStore((s) => s.completions);
  const completeTask = useStore((s) => s.completeTask);
  const undoCompletion = useStore((s) => s.undoCompletion);

  const [dayIndex, setDayIndex] = useState(0);
  const [showOverflow, setShowOverflow] = useState(false);
  const [toast, setToast] = useState<{ text: string; id: string } | null>(null);
  const [burst, setBurst] = useState(0);

  const plan = week[dayIndex];
  const isToday = dayIndex === 0;

  const doneTodayIds = useMemo(() => {
    const key = dayKey(plan.date);
    return new Set(completions.filter((c) => dayKey(c.at) === key).map((c) => c.taskId));
  }, [completions, plan.date]);

  const roomOf = (id: string) => rooms.find((r) => r.id === id);

  const groups = useMemo(() => {
    if (!settings.groupByRooms) {
      return [{ room: null as null | (typeof rooms)[number], tasks: plan.tasks }];
    }
    const map = new Map<string, Task[]>();
    for (const t of plan.tasks) {
      map.set(t.roomId, [...(map.get(t.roomId) ?? []), t]);
    }
    return [...map.entries()].map(([roomId, tasks]) => ({ room: roomOf(roomId) ?? null, tasks }));
  }, [plan.tasks, settings.groupByRooms, rooms]);

  const doneCount = plan.tasks.filter((t) => doneTodayIds.has(t.id)).length;

  function onComplete(t: Task) {
    if (!isToday) return;
    if (doneTodayIds.has(t.id)) {
      const c = completions.find((x) => x.taskId === t.id && dayKey(x.at) === dayKey(new Date()));
      if (c) undoCompletion(c.id);
      return;
    }
    const coins = completeTask(t.id, { source: 'tick' });
    setBurst((b) => b + 1);
    const last = useStore.getState().completions[0];
    setToast({ text: `Nice. +${coins} coins`, id: last?.id ?? '' });
    setTimeout(() => setToast(null), 3200);
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <ScreenGarland seed={3} />
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <T v="display" style={{ fontSize: 32 }}>
              Today
              <T v="display" color={colors.coral} style={{ fontSize: 32 }}>
                .
              </T>
            </T>
            <T v="over" style={{ marginTop: 2 }}>
              {weekdayShort(plan.date)} · {plan.date.getDate()} {monthShort(plan.date).toUpperCase()}
            </T>
          </View>
          <Press onPress={() => router.push('/(tabs)/profile')}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.sage,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={15} color="#FFF8F2" />
            </View>
          </Press>
        </Row>

        {/* Seven-day strip ---------------------------------------- */}
        <Row style={{ marginTop: 16, gap: 6 }}>
          {week.map((d, i) => {
            const active = i === dayIndex;
            return (
              <Pressable
                key={d.key}
                onPress={() => {
                  tap();
                  setDayIndex(i);
                  setShowOverflow(false);
                }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 7,
                  borderRadius: radius.md,
                  backgroundColor: active ? colors.sage : 'transparent',
                }}
              >
                <T v="over" style={{ fontSize: 8.5 }} color={active ? '#EAF3EB' : colors.inkMuted}>
                  {weekdayShort(d.date)}
                </T>
                <T v="heading" style={{ fontSize: 15 }} color={active ? '#FFF8F2' : colors.ink}>
                  {d.date.getDate()}
                </T>
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    marginTop: 3,
                    backgroundColor: d.tasks.length
                      ? active
                        ? '#FFF8F2'
                        : colors.coral
                      : 'transparent',
                  }}
                />
              </Pressable>
            );
          })}
        </Row>

        {/* Summary ------------------------------------------------- */}
        <Spacer h={14} />
        <Card style={{ padding: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="heading">
              {plan.tasks.length} {plan.tasks.length === 1 ? 'task' : 'tasks'}{' '}
              {isToday ? 'today' : 'planned'}
            </T>
            <T v="caption">
              ~{humanMinutes(plan.minutes)} of {plan.budget}
            </T>
          </Row>
          <Spacer h={9} />
          <Bar
            pct={plan.tasks.length ? (doneCount / plan.tasks.length) * 100 : 0}
            color={colors.sage}
          />
          <Spacer h={7} />
          <T v="caption">
            {isToday
              ? `${doneCount} of ${plan.tasks.length} done`
              : 'Projected from what you get through before then'}
          </T>
        </Card>

        {/* Spin ---------------------------------------------------- */}
        {isToday && plan.tasks.length > 1 ? (
          <>
            <Spacer h={12} />
            <Press
              onPress={() => router.push('/spin')}
              style={{
                alignSelf: 'center',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.pill,
                paddingHorizontal: 16,
                paddingVertical: 9,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.coral,
                  borderWidth: 3,
                  borderColor: colors.gold,
                }}
              />
              <T v="heading" style={{ fontSize: 14 }}>
                Spin
              </T>
              <T v="caption">for a task</T>
            </Press>
          </>
        ) : null}

        {/* The list ------------------------------------------------ */}
        {plan.tasks.length === 0 ? (
          <Empty
            emoji={'\u{1F338}'}
            title={isToday ? 'Nothing due today' : 'A free day'}
            body="Everything in the house is still fresh. Enjoy it — the list will find you."
          />
        ) : (
          groups.map(({ room, tasks }) => (
            <View key={room?.id ?? 'all'}>
              {room ? (
                <GroupHeader color={room.color} name={room.name} count={tasks.length} />
              ) : (
                <Spacer h={10} />
              )}
              {tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  color={room?.color ?? colors.sage}
                  done={doneTodayIds.has(t.id)}
                  onToggle={() => onComplete(t)}
                  onPress={() => router.push(`/task/${t.id}`)}
                />
              ))}
            </View>
          ))
        )}

        {/* Got more time? ------------------------------------------ */}
        {plan.overflow.length ? (
          <>
            <Spacer h={16} />
            <Press
              onPress={() => setShowOverflow((v) => !v)}
              style={{
                backgroundColor: colors.cardAlt,
                borderRadius: radius.md,
                paddingVertical: 12,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Row style={{ gap: 8 }}>
                <Ionicons name="add-circle-outline" size={16} color={colors.inkSoft} />
                <T v="heading" style={{ fontSize: 13.5 }}>
                  Got more time?
                </T>
                <View
                  style={{
                    backgroundColor: colors.coral,
                    borderRadius: 10,
                    paddingHorizontal: 7,
                    paddingVertical: 1,
                  }}
                >
                  <T v="caption" color="#FFF8F2" style={{ fontSize: 10.5 }}>
                    {plan.overflow.length}
                  </T>
                </View>
              </Row>
              <Ionicons
                name={showOverflow ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.inkMuted}
              />
            </Press>
            {showOverflow ? (
              <View style={{ paddingHorizontal: 4 }}>
                <Spacer h={6} />
                <T v="caption">
                  These are over today's budget. Completing them still earns coins and keeps your
                  streak.
                </T>
                {plan.overflow.map((t) => {
                  const room = roomOf(t.roomId);
                  return (
                    <TaskRow
                      key={t.id}
                      task={t}
                      color={room?.color ?? colors.sage}
                      done={doneTodayIds.has(t.id)}
                      onToggle={() => onComplete(t)}
                      onPress={() => router.push(`/task/${t.id}`)}
                      showRoom
                      roomName={room?.name}
                    />
                  );
                })}
              </View>
            ) : null}
          </>
        ) : null}

        {/* Focus --------------------------------------------------- */}
        {isToday && plan.tasks.length ? (
          <>
            <Spacer h={20} />
            <Btn
              label="Start focused cleaning"
              icon="sparkles"
              onPress={() => router.push('/focus')}
            />
          </>
        ) : null}
      </Screen>

      <Confetti trigger={burst} />
      {toast ? (
        <Toast
          text={toast.text}
          action="Undo"
          onAction={() => {
            undoCompletion(toast.id);
            setToast(null);
          }}
        />
      ) : null}
    </View>
  );
}
