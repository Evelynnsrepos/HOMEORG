import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, View, useWindowDimensions } from 'react-native';

import { dayKey } from '../../src/lib/date';
import { cleanliness, priority, roomHealth } from '../../src/lib/engine';
import { useStore } from '../../src/state/store';
import { band, bandColor, bandLabel, colors, radius } from '../../src/theme';
import { Bar, Btn, Card, Chip, Empty, IconBtn, Press, Row, Screen, Spacer, T } from '../../src/ui/base';
import { RoomCanvas } from '../../src/ui/RoomCanvas';
import { TaskRow, Toast } from '../../src/ui/TaskRow';


export default function RoomDetail() {
  const { width: W } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const room = useStore((s) => s.rooms.find((r) => r.id === id));
  const allTasks = useStore((s) => s.tasks);
  const completions = useStore((s) => s.completions);
  const completeTask = useStore((s) => s.completeTask);
  const undoCompletion = useStore((s) => s.undoCompletion);
  const deleteRoom = useStore((s) => s.deleteRoom);

  const [filter, setFilter] = useState<'all' | 'due'>('all');
  const [toast, setToast] = useState<{ text: string; id: string } | null>(null);

  const tasks = useMemo(() => allTasks.filter((t) => t.roomId === id), [allTasks, id]);
  const health = useMemo(() => roomHealth(tasks), [tasks]);

  const doneToday = useMemo(() => {
    const key = dayKey();
    return new Set(completions.filter((c) => dayKey(c.at) === key).map((c) => c.taskId));
  }, [completions]);

  const sorted = useMemo(() => {
    const list = filter === 'due' ? tasks.filter((t) => cleanliness(t) < 60) : tasks;
    return [...list].sort((a, b) => priority(b) - priority(a));
  }, [tasks, filter]);

  if (!room) {
    return (
      <Screen>
        <Empty emoji={'\u{1F6AA}'} title="This room is gone" />
        <Btn label="Back" tone="quiet" onPress={() => router.back()} />
      </Screen>
    );
  }

  const b = band(health);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => router.back()} />
          <Row style={{ gap: 2 }}>
            <IconBtn name="color-palette-outline" onPress={() => router.push(`/decorate/${room.id}`)} />
            <IconBtn name="create-outline" onPress={() => router.push(`/room/edit/${room.id}`)} />
            <IconBtn
              name="trash-outline"
              onPress={() =>
                Alert.alert(
                  `Delete ${room.name}?`,
                  `${room.name} and all its tasks will be removed. This can't be undone.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        deleteRoom(room.id);
                        router.back();
                      },
                    },
                  ],
                )
              }
            />
          </Row>
        </Row>

        <Spacer h={6} />
        <T v="display" style={{ fontSize: 28 }}>
          {room.emoji} {room.name}
        </T>
        <Spacer h={12} />

        <View style={{ borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
          <RoomCanvas room={room} width={W - 34} dim={Math.max(0, (70 - health) / 100)} />
        </View>

        <Spacer h={12} />
        <Card style={{ padding: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="heading">Room health</T>
            <Row style={{ gap: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: bandColor[b] }} />
              <T v="label" color={bandColor[b]}>
                {bandLabel[b]} · {health}%
              </T>
            </Row>
          </Row>
          <Spacer h={9} />
          <Bar pct={health} color={bandColor[b]} />
          <Spacer h={8} />
          <T v="caption">
            A weighted average — the heavy jobs pull it more than the little ones.
          </T>
        </Card>

        <Spacer h={12} />
        <Row style={{ gap: 8 }}>
          <Btn
            style={{ flex: 1 }}
            label="Focused cleaning"
            icon="sparkles"
            small
            onPress={() => router.push(`/focus?roomId=${room.id}`)}
          />
          <Btn
            style={{ flex: 1 }}
            label="Decorate"
            icon="color-palette"
            tone="quiet"
            small
            onPress={() => router.push(`/decorate/${room.id}`)}
          />
        </Row>

        <Row style={{ marginTop: 20, justifyContent: 'space-between' }}>
          <T v="over">{tasks.length} chores</T>
          <Row style={{ gap: 6 }}>
            <Chip small label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip small label="Due" active={filter === 'due'} onPress={() => setFilter('due')} />
          </Row>
        </Row>

        {sorted.length === 0 ? (
          <Empty emoji={'\u{2728}'} title="Nothing here" body="Add a chore to get this room going." />
        ) : (
          sorted.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              color={room.color}
              showBar
              done={doneToday.has(t.id)}
              onToggle={() => {
                if (doneToday.has(t.id)) {
                  const c = completions.find(
                    (x) => x.taskId === t.id && dayKey(x.at) === dayKey(new Date()),
                  );
                  if (c) undoCompletion(c.id);
                  return;
                }
                const coins = completeTask(t.id, { source: 'tick' });
                const last = useStore.getState().completions[0];
                setToast({ text: `Back to 100%. +${coins} coins`, id: last?.id ?? '' });
                setTimeout(() => setToast(null), 3000);
              }}
              onPress={() => router.push(`/task/${t.id}`)}
            />
          ))
        )}

        <Spacer h={16} />
        <Press
          onPress={() => router.push(`/task/new?roomId=${room.id}`)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: colors.line,
            borderRadius: radius.md,
            paddingVertical: 13,
          }}
        >
          <Ionicons name="add" size={16} color={colors.inkSoft} />
          <T v="heading" style={{ fontSize: 13.5 }}>
            Add a chore
          </T>
        </Press>
      </Screen>

      {toast ? (
        <Toast
          text={toast.text}
          action="Undo"
          bottom={30}
          onAction={() => {
            undoCompletion(toast.id);
            setToast(null);
          }}
        />
      ) : null}
    </View>
  );
}
