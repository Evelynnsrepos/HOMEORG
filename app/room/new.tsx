import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { roomTypeById, roomTypes, startingConditions } from '../../src/data/roomTypes';
import { useStore } from '../../src/state/store';
import { colors, radius } from '../../src/theme';
import { Btn, Chip, EmojiTile, IconBtn, Row, Screen, Spacer, T, tap } from '../../src/ui/base';
import { Field } from '../../src/ui/TaskFields';

const EMOJI = [
  '\u{1F373}', '\u{1F6CB}\u{FE0F}', '\u{1F6C1}', '\u{1F6CF}\u{FE0F}', '\u{1F9F8}', '\u{1F37D}\u{FE0F}',
  '\u{1F4BB}', '\u{1F6AA}', '\u{1F9FA}', '\u{1FA9F}', '\u{1F6B2}', '\u{1FAB4}', '\u{1F4E6}',
  '\u{1F6BD}', '\u{2728}', '\u{1F3AE}', '\u{1F3B8}', '\u{1F415}',
];

export default function NewRoom() {
  const router = useRouter();
  const addRoom = useStore((s) => s.addRoom);
  const settings = useStore((s) => s.settings);

  const [step, setStep] = useState(0);
  const [typeId, setTypeId] = useState('kitchen');
  const [off, setOff] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('\u{1F373}');
  const [floor, setFloor] = useState(0);
  const [condition, setCondition] = useState(0.5);

  const type = roomTypeById(typeId);
  const chores = useMemo(
    () => type.chores.filter((c) => !off.includes(c.name) && (c.on || off.includes(`+${c.name}`))),
    [type, off],
  );

  function toggleChore(choreName: string, isOn: boolean) {
    tap();
    setOff((prev) => {
      if (isOn) return [...prev.filter((x) => x !== `+${choreName}`), choreName];
      return [...prev.filter((x) => x !== choreName), `+${choreName}`];
    });
  }

  function pickType(id: string) {
    tap();
    setTypeId(id);
    const t = roomTypeById(id);
    setName(t.id === 'custom' ? '' : t.name);
    setEmoji(t.emoji);
    setOff([]);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn
            name={step === 0 ? 'close' : 'chevron-back'}
            onPress={() => (step === 0 ? router.back() : setStep((s) => s - 1))}
          />
          <T v="heading">Add a room</T>
          <View style={{ width: 38 }} />
        </Row>

        {step === 0 ? (
          <>
            <Spacer h={12} />
            <T v="display" style={{ fontSize: 26 }}>
              What kind of room?
            </T>
            <Spacer h={6} />
            <T v="body">Picking a type fills in the usual chores. You can change any of them.</T>
            <Spacer h={16} />
            {roomTypes.map((rt) => (
              <Pressable
                key={rt.id}
                onPress={() => pickType(rt.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: typeId === rt.id ? colors.sageSoft : colors.card,
                  borderWidth: 1.5,
                  borderColor: typeId === rt.id ? colors.sage : colors.lineSoft,
                  borderRadius: radius.md,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <EmojiTile emoji={rt.emoji} size={36} bg={colors.bgDeep} />
                <View style={{ flex: 1 }}>
                  <T v="heading" style={{ fontSize: 14.5 }}>
                    {rt.name}
                  </T>
                  <T v="caption">
                    {rt.chores.length ? `${rt.chores.length} chores to choose from` : 'Start empty'}
                  </T>
                </View>
                {typeId === rt.id ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.sage} />
                ) : null}
              </Pressable>
            ))}
            <Spacer h={12} />
            <Btn label="Continue" onPress={() => setStep(1)} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Spacer h={12} />
            <T v="display" style={{ fontSize: 26 }}>
              Which chores?
            </T>
            <Spacer h={6} />
            <T v="body">{chores.length} selected. Tap to add or drop any of them.</T>
            <Spacer h={16} />
            {type.chores.length === 0 ? (
              <T v="body">A custom room starts empty — you'll add chores yourself.</T>
            ) : (
              type.chores.map((c) => {
                const on = chores.some((x) => x.name === c.name);
                return (
                  <Pressable
                    key={c.name}
                    onPress={() => toggleChore(c.name, on)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 11,
                    }}
                  >
                    <View
                      style={{
                        width: 21,
                        height: 21,
                        borderRadius: 7,
                        borderWidth: 2,
                        borderColor: on ? colors.sage : colors.line,
                        backgroundColor: on ? colors.sage : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {on ? <Ionicons name="checkmark" size={13} color="#FFF" /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <T v="heading" style={{ fontSize: 14 }}>
                        {c.name}
                      </T>
                      <T v="caption">
                        {c.minutes} min · every {c.every}{' '}
                        {c.every === 1 ? c.unit : `${c.unit}s`}
                      </T>
                    </View>
                  </Pressable>
                );
              })
            )}
            <Spacer h={16} />
            <Btn label="Continue" onPress={() => setStep(2)} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Spacer h={12} />
            <T v="display" style={{ fontSize: 26 }}>
              Name it.
            </T>
            <Spacer h={16} />
            <Field label="Room name" value={name} onChangeText={setName} placeholder="Kitchen" />

            <Spacer h={18} />
            <T v="over">Emoji</T>
            <Spacer h={8} />
            <Row style={{ flexWrap: 'wrap', gap: 7 }}>
              {EMOJI.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => {
                    tap();
                    setEmoji(e);
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: emoji === e ? colors.sageSoft : colors.card,
                    borderWidth: 1.5,
                    borderColor: emoji === e ? colors.sage : colors.lineSoft,
                  }}
                >
                  <T style={{ fontSize: 19 }}>{e}</T>
                </Pressable>
              ))}
            </Row>

            {settings.floors.length > 1 ? (
              <>
                <Spacer h={18} />
                <T v="over">Floor</T>
                <Spacer h={8} />
                <Row style={{ gap: 7, flexWrap: 'wrap' }}>
                  {settings.floors.map((f, i) => (
                    <Chip key={f} small label={f} active={floor === i} onPress={() => setFloor(i)} />
                  ))}
                </Row>
              </>
            ) : null}

            <Spacer h={18} />
            <T v="over">Starting condition</T>
            <Spacer h={8} />
            <Row style={{ gap: 7, flexWrap: 'wrap' }}>
              {startingConditions.map((sc) => (
                <Chip
                  key={sc.id}
                  small
                  label={sc.name}
                  active={condition === sc.progress}
                  onPress={() => setCondition(sc.progress)}
                />
              ))}
            </Row>

            <Spacer h={24} />
            <Btn
              label={`Add the room · ${chores.length} chores`}
              disabled={!name.trim()}
              onPress={() => {
                const id = addRoom({
                  typeId,
                  name: name.trim(),
                  emoji,
                  floor,
                  condition,
                  chores: chores.map((c) => ({
                    name: c.name,
                    minutes: c.minutes,
                    effort: c.effort,
                    every: c.every,
                    unit: c.unit,
                  })),
                });
                router.replace(`/room/${id}`);
              }}
            />
          </>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}
