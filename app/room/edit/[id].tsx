import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';

import { useStore } from '../../../src/state/store';
import { colors, roomPalette } from '../../../src/theme';
import { Btn, Chip, Empty, IconBtn, Row, Screen, Spacer, T, tap } from '../../../src/ui/base';
import { Field } from '../../../src/ui/TaskFields';

const EMOJI = [
  '\u{1F373}', '\u{1F6CB}\u{FE0F}', '\u{1F6C1}', '\u{1F6CF}\u{FE0F}', '\u{1F9F8}', '\u{1F37D}\u{FE0F}',
  '\u{1F4BB}', '\u{1F6AA}', '\u{1F9FA}', '\u{1FA9F}', '\u{1F6B2}', '\u{1FAB4}', '\u{1F4E6}',
  '\u{1F6BD}', '\u{2728}', '\u{1F3AE}', '\u{1F3B8}', '\u{1F415}',
];

export default function EditRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const room = useStore((s) => s.rooms.find((r) => r.id === id));
  const settings = useStore((s) => s.settings);
  const updateRoom = useStore((s) => s.updateRoom);
  const deleteRoom = useStore((s) => s.deleteRoom);

  const [name, setName] = useState(room?.name ?? '');
  const [emoji, setEmoji] = useState(room?.emoji ?? '\u{2728}');
  const [floor, setFloor] = useState(room?.floor ?? 0);
  const [color, setColor] = useState(room?.color ?? roomPalette[0]);

  if (!room) {
    return (
      <Screen>
        <Empty emoji={'\u{1F6AA}'} title="Room not found" />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => router.back()} />
          <T v="heading">Edit room</T>
          <View style={{ width: 38 }} />
        </Row>

        <Spacer h={16} />
        <Field label="Name" value={name} onChangeText={setName} />

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

        <Spacer h={18} />
        <T v="over">Colour</T>
        <Spacer h={8} />
        <Row style={{ gap: 9 }}>
          {roomPalette.map((c) => (
            <Pressable
              key={c}
              onPress={() => {
                tap();
                setColor(c);
              }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: colors.ink,
              }}
            />
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

        <Spacer h={26} />
        <Btn
          label="Save changes"
          disabled={!name.trim()}
          onPress={() => {
            updateRoom(room.id, { name: name.trim(), emoji, floor, color });
            router.back();
          }}
        />
        <Spacer h={10} />
        <Btn
          label="Delete room"
          tone="quiet"
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
                    router.replace('/');
                  },
                },
              ],
            )
          }
        />
        <Spacer h={12} />
        <T v="caption" center>
          Deleting takes its chores, history and photos with it.
        </T>
      </Screen>
    </KeyboardAvoidingView>
  );
}
