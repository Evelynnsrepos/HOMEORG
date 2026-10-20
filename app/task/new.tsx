import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { useStore } from '../../src/state/store';
import { Btn, IconBtn, Row, Screen, Spacer, T } from '../../src/ui/base';
import { Draft, TaskFields } from '../../src/ui/TaskFields';

export default function NewTask() {
  const { roomId } = useLocalSearchParams<{ roomId?: string }>();
  const router = useRouter();
  const rooms = useStore((s) => s.rooms);
  const addTask = useStore((s) => s.addTask);

  const [draft, setDraft] = useState<Draft>({
    name: '',
    roomId: roomId ?? rooms[0]?.id ?? '',
    minutes: 10,
    effort: 'light',
    kind: 'recurring',
    every: 1,
    unit: 'week',
  });

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="close" onPress={() => router.back()} />
          <T v="heading">New chore</T>
          <IconBtn name="close" color="transparent" />
        </Row>
        <Spacer h={12} />
        <TaskFields draft={draft} set={set} rooms={rooms} />
        <Spacer h={24} />
        <Btn
          label="Add chore"
          disabled={!draft.name.trim() || !draft.roomId}
          onPress={() => {
            addTask({
              name: draft.name.trim(),
              roomId: draft.roomId,
              minutes: draft.minutes,
              effort: draft.effort,
              kind: draft.kind,
              every: draft.every,
              unit: draft.unit,
              dueDate: draft.kind === 'once' ? draft.dueDate : undefined,
              notes: draft.notes,
              // a brand new chore starts due, so it shows up straight away
              lastDone: draft.kind === 'recurring' ? null : new Date().toISOString(),
            });
            router.back();
          }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
