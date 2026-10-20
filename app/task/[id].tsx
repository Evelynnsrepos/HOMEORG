import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { addDays, dayKey, lastDoneLabel, weekdayShort } from '../../src/lib/date';
import { cleanliness, coinsForEffort, dueDateOf, effortLabel } from '../../src/lib/engine';
import { frequencyLabel } from '../../src/lib/format';
import { useStore } from '../../src/state/store';
import { band, bandColor, colors, radius } from '../../src/theme';
import {
  Bar,
  Btn,
  Card,
  Chip,
  Divider,
  Empty,
  IconBtn,
  Row,
  Screen,
  Spacer,
  T,
} from '../../src/ui/base';
import { Draft, TaskFields } from '../../src/ui/TaskFields';

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const task = useStore((s) => s.tasks.find((t) => t.id === id));
  const rooms = useStore((s) => s.rooms);
  const completions = useStore((s) => s.completions);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const completeTask = useStore((s) => s.completeTask);
  const deferTask = useStore((s) => s.deferTask);
  const attachPhoto = useStore((s) => s.attachPhoto);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  const history = useMemo(
    () => completions.filter((c) => c.taskId === id).slice(0, 12),
    [completions, id],
  );

  if (!task) {
    return (
      <Screen>
        <Empty emoji={'\u{1F4CB}'} title="This chore is gone" />
        <Btn label="Back" tone="quiet" onPress={() => router.back()} />
      </Screen>
    );
  }

  const room = rooms.find((r) => r.id === task.roomId);
  const pct = cleanliness(task);
  const b = band(pct);
  const color = room?.color ?? colors.sage;

  function startEdit() {
    if (!task) return;
    setDraft({
      name: task.name,
      roomId: task.roomId,
      minutes: task.minutes,
      effort: task.effort,
      kind: task.kind,
      every: task.every,
      unit: task.unit,
      dueDate: task.dueDate,
      notes: task.notes,
    });
    setEditing(true);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => router.back()} />
          <Row style={{ gap: 2 }}>
            {editing ? null : <IconBtn name="create-outline" onPress={startEdit} />}
            <IconBtn
              name="trash-outline"
              onPress={() =>
                Alert.alert('Delete this chore?', `"${task.name}" and its history will go.`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      deleteTask(task.id);
                      router.back();
                    },
                  },
                ])
              }
            />
          </Row>
        </Row>

        {editing && draft ? (
          <>
            <Spacer h={8} />
            <T v="display" style={{ fontSize: 26 }}>
              Edit chore
            </T>
            <Spacer h={16} />
            <TaskFields draft={draft} set={(p) => setDraft({ ...draft, ...p })} rooms={rooms} />
            <Spacer h={22} />
            <Row style={{ gap: 10 }}>
              <Btn label="Cancel" tone="quiet" full={false} onPress={() => setEditing(false)} />
              <Btn
                style={{ flex: 1 }}
                label="Save changes"
                onPress={() => {
                  updateTask(task.id, {
                    name: draft.name.trim(),
                    roomId: draft.roomId,
                    minutes: draft.minutes,
                    effort: draft.effort,
                    kind: draft.kind,
                    every: draft.every,
                    unit: draft.unit,
                    dueDate: draft.kind === 'once' ? draft.dueDate : undefined,
                    notes: draft.notes,
                  });
                  setEditing(false);
                }}
              />
            </Row>
          </>
        ) : (
          <>
            <Spacer h={6} />
            <Row style={{ gap: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
              <T v="over" color={color}>
                {room?.name ?? 'No room'}
              </T>
            </Row>
            <Spacer h={6} />
            <T v="display" style={{ fontSize: 27, lineHeight: 31 }}>
              {task.name}
            </T>

            <Spacer h={16} />
            <Row style={{ gap: 7, flexWrap: 'wrap' }}>
              <Badge icon="speedometer-outline" text={effortLabel[task.effort]} />
              <Badge icon="time-outline" text={`${task.minutes} min`} />
              <Badge icon="repeat-outline" text={frequencyLabel(task)} />
              <Badge icon="ellipse" text={`+${coinsForEffort[task.effort]} coins`} tint={colors.gold} />
            </Row>

            <Spacer h={16} />
            <Card style={{ padding: 14 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="heading">Cleanliness</T>
                <T v="label" color={bandColor[b]}>
                  {Math.round(pct)}%
                </T>
              </Row>
              <Spacer h={9} />
              <Bar pct={pct} color={bandColor[b]} />
              <Spacer h={8} />
              <T v="caption">
                Last done {lastDoneLabel(task.lastDone).toLowerCase()}
                {task.kind === 'recurring'
                  ? ` · due ${dueDateOf(task).getDate()} ${weekdayShort(dueDateOf(task))}`
                  : ''}
              </T>
            </Card>

            {task.notes ? (
              <>
                <Spacer h={12} />
                <Card soft style={{ padding: 14 }}>
                  <T v="over">Notes</T>
                  <Spacer h={6} />
                  <T v="body">{task.notes}</T>
                </Card>
              </>
            ) : null}

            <Spacer h={16} />
            <Btn
              label="Mark complete"
              icon="checkmark"
              onPress={() => {
                completeTask(task.id, { source: 'tick' });
                router.back();
              }}
            />

            <Spacer h={20} />
            <T v="over">Push it to another day</T>
            <Spacer h={8} />
            <Row style={{ gap: 7, flexWrap: 'wrap' }}>
              {[1, 2, 3, 7].map((n) => {
                const target = dayKey(addDays(new Date(), n));
                return (
                  <Chip
                    key={n}
                    small
                    label={n === 7 ? 'Next week' : `+${n} ${n === 1 ? 'day' : 'days'}`}
                    active={task.deferredTo === target}
                    onPress={() => deferTask(task.id, task.deferredTo === target ? null : target)}
                  />
                );
              })}
            </Row>

            <Spacer h={22} />
            <T v="over">Before & after</T>
            <Spacer h={4} />
            <T v="caption">
              Photos stay in this app on this phone. Nothing is uploaded, and the oldest are dropped
              after 35 days.
            </T>
            <Spacer h={10} />
            {history[0] ? (
              <Row style={{ gap: 10 }}>
                <PhotoSlot
                  label="Before"
                  uri={history[0].photoBefore}
                  onPick={(uri) => attachPhoto(history[0].id, 'before', uri)}
                />
                <PhotoSlot
                  label="After"
                  uri={history[0].photoAfter}
                  onPick={(uri) => attachPhoto(history[0].id, 'after', uri)}
                />
              </Row>
            ) : (
              <T v="caption">Complete it once and you can attach a pair here.</T>
            )}

            <Spacer h={22} />
            <T v="over">History</T>
            <Spacer h={4} />
            {history.length === 0 ? (
              <T v="caption">Nothing recorded yet.</T>
            ) : (
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                {history.map((c, i) => (
                  <View key={c.id}>
                    {i ? <Divider /> : null}
                    <Row style={{ padding: 13, justifyContent: 'space-between' }}>
                      <View>
                        <T v="label">{lastDoneLabel(c.at)}</T>
                        <T v="caption">
                          {c.source === 'tick' ? 'Ticked off' : `In ${c.source}`}
                          {c.minutes != null ? ` · ${Math.round(c.minutes)} min recorded` : ''}
                        </T>
                      </View>
                      <T v="label" color={colors.gold}>
                        +{c.coins}
                      </T>
                    </Row>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function PhotoSlot({
  label,
  uri,
  onPick,
}: {
  label: string;
  uri?: string;
  onPick: (uri: string) => void;
}) {
  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.55,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets[0]?.uri) onPick(res.assets[0].uri);
  }

  return (
    <Pressable
      onPress={pick}
      style={{
        flex: 1,
        aspectRatio: 1,
        borderRadius: radius.md,
        borderWidth: uri ? 0 : 1.5,
        borderStyle: uri ? 'solid' : 'dashed',
        borderColor: colors.line,
        backgroundColor: colors.cardAlt,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <>
          <Ionicons name="camera-outline" size={20} color={colors.inkMuted} />
          <Spacer h={5} />
          <T v="caption">{label}</T>
        </>
      )}
    </Pressable>
  );
}

function Badge({
  icon,
  text,
  tint = colors.inkSoft,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  tint?: string;
}) {
  return (
    <Row
      style={{
        backgroundColor: colors.cardAlt,
        borderRadius: radius.pill,
        paddingHorizontal: 11,
        paddingVertical: 6,
        gap: 5,
      }}
    >
      <Ionicons name={icon} size={12} color={tint} />
      <T v="label" style={{ fontSize: 12 }} color={tint}>
        {text}
      </T>
    </Row>
  );
}
