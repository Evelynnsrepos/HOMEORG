import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';

import { dayKey } from '../src/lib/date';
import { PRESETS, SCALES, isHardDay, nearestPreset, type Scales } from '../src/lib/mood';
import type { MoodPreset } from '../src/lib/types';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Btn, Card, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../src/ui/base';
import { Comfort } from '../src/ui/Comfort';
import { Slider } from '../src/ui/Slider';

const TINTS: Record<keyof Scales, string> = { mood: '#FF79B0', social: '#B48CF0', clean: '#6FCDA8', hobby: '#FFB35C' };

/**
 * "How do you feel today?" — a preset in one tap, or four sliders for the
 * days you want to say more. On a hard day the answer is kindness: a few
 * gentle lines and ways to do less. Everything stays on this phone.
 */
export default function Mood() {
  const router = useRouter();
  const params = useLocalSearchParams<{ comfort?: string }>();
  const today = useStore((s) => (s.moods ?? []).filter((m) => m.day === dayKey()).at(-1));
  const saveMood = useStore((s) => s.saveMood);

  const [preset, setPreset] = useState<MoodPreset | undefined>(today?.preset);
  const [v, setV] = useState<Scales>(
    today ? { mood: today.mood, social: today.social, clean: today.clean, hobby: today.hobby } : PRESETS[1].values,
  );
  const [note, setNote] = useState(today?.note ?? '');
  const [comfort, setComfort] = useState<Scales | null>(params.comfort && today ? v : null);

  function save() {
    saveMood({ ...v, preset, note: note.trim() || undefined });
    if (isHardDay({ ...v, preset })) setComfort(v);
    else router.back();
  }

  const face = presetById(preset) ?? nearestPreset(v);

  return (
    <View style={{ flex: 1 }}>
      <Screen keyboardShouldPersistTaps="handled">
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => router.back()} />
          <T v="heading">Check in</T>
          <IconBtn name="stats-chart-outline" onPress={() => router.push('/mood-data')} />
        </Row>

        <Spacer h={10} />
        <T v="display" style={{ fontSize: 28 }}>
          How do you feel today?
        </T>
        <Spacer h={4} />
        <T v="label">No right answers. It stays on this phone.</T>

        <Spacer h={16} />
        <Row style={{ gap: 6 }}>
          {PRESETS.map((p) => (
            <Press
              key={p.id}
              onPress={() => {
                tap();
                setPreset(p.id);
                setV(p.values);
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 10,
                borderRadius: radius.md,
                borderWidth: 2,
                borderColor: preset === p.id ? colors.coral : colors.lineSoft,
                backgroundColor: preset === p.id ? colors.coralSoft : colors.card,
              }}
            >
              <T style={{ fontSize: 26 }}>{p.emoji}</T>
              <T v="caption" color={colors.ink}>
                {p.label}
              </T>
            </Press>
          ))}
        </Row>

        <Spacer h={14} />
        <Card>
          {SCALES.map((s, i) => (
            <View key={s.key} style={{ marginTop: i ? 12 : 0 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="label" color={colors.ink}>
                  {s.emoji} {s.label}
                </T>
                <T v="caption">{v[s.key] <= 25 ? s.low : v[s.key] >= 75 ? s.high : `${v[s.key]}`}</T>
              </Row>
              <Slider
                label={s.label}
                value={v[s.key]}
                tint={TINTS[s.key]}
                onChange={(n) => {
                  setPreset(undefined);
                  setV((old) => ({ ...old, [s.key]: n }));
                }}
              />
            </View>
          ))}
        </Card>

        <Spacer h={12} />
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Anything else? (just for you)"
          placeholderTextColor={colors.inkMuted}
          multiline
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.lineSoft,
            padding: 12,
            minHeight: 60,
            fontFamily: font.body,
            fontSize: 14,
            color: colors.ink,
          }}
        />

        <Spacer h={16} />
        <Btn icon="heart" label={today ? `Update · feeling ${face.label.toLowerCase()}` : `Save · feeling ${face.label.toLowerCase()}`} onPress={save} />
        <Spacer h={8} />
        <Btn small tone="ghost" icon="stats-chart-outline" label="See what you've tracked" onPress={() => router.push('/mood-data')} />
      </Screen>

      {comfort ? <Comfort v={comfort} onClose={() => (setComfort(null), router.back())} /> : null}
    </View>
  );
}

function presetById(id?: MoodPreset) {
  return PRESETS.find((p) => p.id === id);
}
