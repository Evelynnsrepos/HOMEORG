import React from 'react';
import { TextInput, View } from 'react-native';

import type { Unit } from '../lib/date';
import type { Effort, TaskKind } from '../lib/types';
import { colors, font, radius } from '../theme';
import { Chip, Row, Spacer, T } from './base';

export interface Draft {
  name: string;
  roomId: string;
  minutes: number;
  effort: Effort;
  kind: TaskKind;
  every: number;
  unit: Unit;
  dueDate?: string;
  notes?: string;
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View>
      <T v="over">{label}</T>
      <Spacer h={7} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          backgroundColor: colors.card,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.line,
          paddingHorizontal: 14,
          paddingVertical: 12,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
          fontFamily: font.medium,
          fontSize: 15,
          color: colors.ink,
        }}
      />
    </View>
  );
}

const efforts: { id: Effort; label: string; hint: string }[] = [
  { id: 'light', label: 'Light', hint: 'A quick win' },
  { id: 'medium', label: 'Medium', hint: 'A proper job' },
  { id: 'deep', label: 'Deep', hint: 'Roll your sleeves up' },
];

const kinds: { id: TaskKind; label: string }[] = [
  { id: 'recurring', label: 'Repeats' },
  { id: 'once', label: 'One-off' },
  { id: 'whenever', label: 'Whenever' },
];

const presets: { label: string; every: number; unit: Unit }[] = [
  { label: 'Daily', every: 1, unit: 'day' },
  { label: 'Every 2 days', every: 2, unit: 'day' },
  { label: 'Every 3 days', every: 3, unit: 'day' },
  { label: 'Weekly', every: 1, unit: 'week' },
  { label: 'Fortnightly', every: 2, unit: 'week' },
  { label: 'Monthly', every: 1, unit: 'month' },
  { label: 'Quarterly', every: 3, unit: 'month' },
  { label: 'Twice a year', every: 6, unit: 'month' },
  { label: 'Yearly', every: 1, unit: 'year' },
];

export function TaskFields({
  draft,
  set,
  rooms,
}: {
  draft: Draft;
  set: (patch: Partial<Draft>) => void;
  rooms: { id: string; name: string; emoji: string }[];
}) {
  return (
    <View>
      <Field
        label="What is it?"
        value={draft.name}
        onChangeText={(name) => set({ name })}
        placeholder="Wipe the counters"
      />

      <Spacer h={18} />
      <T v="over">Room</T>
      <Spacer h={7} />
      <Row style={{ flexWrap: 'wrap', gap: 7 }}>
        {rooms.map((r) => (
          <Chip
            key={r.id}
            small
            label={`${r.emoji} ${r.name}`}
            active={draft.roomId === r.id}
            onPress={() => set({ roomId: r.id })}
          />
        ))}
      </Row>

      <Spacer h={18} />
      <T v="over">How often</T>
      <Spacer h={7} />
      <Row style={{ gap: 7 }}>
        {kinds.map((k) => (
          <Chip
            key={k.id}
            small
            label={k.label}
            active={draft.kind === k.id}
            onPress={() => set({ kind: k.id })}
          />
        ))}
      </Row>

      {draft.kind === 'recurring' ? (
        <>
          <Spacer h={10} />
          <Row style={{ flexWrap: 'wrap', gap: 7 }}>
            {presets.map((p) => (
              <Chip
                key={p.label}
                small
                label={p.label}
                active={draft.every === p.every && draft.unit === p.unit}
                onPress={() => set({ every: p.every, unit: p.unit })}
              />
            ))}
          </Row>
        </>
      ) : null}

      {draft.kind === 'once' ? (
        <>
          <Spacer h={10} />
          <Field
            label="Due date (YYYY-MM-DD)"
            value={draft.dueDate ?? ''}
            onChangeText={(dueDate) => set({ dueDate })}
            placeholder="2026-09-20"
          />
        </>
      ) : null}

      {draft.kind === 'whenever' ? (
        <>
          <Spacer h={8} />
          <T v="caption">
            No schedule and no decay. It waits in the room and turns up in Focus until you do it.
          </T>
        </>
      ) : null}

      <Spacer h={18} />
      <T v="over">How heavy</T>
      <Spacer h={7} />
      <Row style={{ gap: 7 }}>
        {efforts.map((e) => (
          <Chip
            key={e.id}
            small
            label={e.label}
            active={draft.effort === e.id}
            onPress={() => set({ effort: e.id })}
          />
        ))}
      </Row>
      <Spacer h={6} />
      <T v="caption">{efforts.find((e) => e.id === draft.effort)?.hint}</T>

      <Spacer h={18} />
      <T v="over">Rough minutes</T>
      <Spacer h={7} />
      <Row style={{ flexWrap: 'wrap', gap: 7 }}>
        {[2, 3, 5, 8, 10, 15, 20, 30, 45, 60].map((m) => (
          <Chip
            key={m}
            small
            label={`${m}m`}
            active={draft.minutes === m}
            onPress={() => set({ minutes: m })}
          />
        ))}
      </Row>

      <Spacer h={18} />
      <Field
        label="Notes (optional)"
        value={draft.notes ?? ''}
        onChangeText={(notes) => set({ notes })}
        placeholder="Anything worth remembering"
        multiline
      />
    </View>
  );
}
