import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';

import { useStore } from '../../src/state/store';
import { colors, font, radius, roomPalette } from '../../src/theme';
import { Btn, Card, Chip, IconBtn, Row, Screen, Spacer, T, tap } from '../../src/ui/base';
import { Field } from '../../src/ui/TaskFields';

const EMOJI = ['\u{1F3C6}', '\u{1F9F9}', '\u{1F338}', '\u{1F4E6}', '\u{2728}', '\u{1F525}', '\u{1F31F}', '\u{1F3E1}'];

export default function NewChallenge() {
  const router = useRouter();
  const rooms = useStore((s) => s.rooms);
  const tasks = useStore((s) => s.tasks);
  const create = useStore((s) => s.createCustomChallenge);
  const join = useStore((s) => s.joinChallenge);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI[0]);
  const [color, setColor] = useState(roomPalette[0]);
  const [days, setDays] = useState<3 | 7 | 14 | 30>(7);
  const [picked, setPicked] = useState<string[]>([]);
  const [oneOffs, setOneOffs] = useState<string[]>([]);
  const [oneOffDraft, setOneOffDraft] = useState('');
  const [search, setSearch] = useState('');

  const total = picked.length + oneOffs.length;
  const reward = Math.min(200, total * 5);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => !q || t.name.toLowerCase().includes(q));
  }, [tasks, search]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="close" onPress={() => router.back()} />
          <T v="heading">New challenge</T>
          <View style={{ width: 38 }} />
        </Row>

        <Spacer h={12} />
        <Field label="Name it" value={name} onChangeText={setName} placeholder="Sort the spare room" />

        <Spacer h={18} />
        <T v="over">Look</T>
        <Spacer h={8} />
        <Row style={{ gap: 7, flexWrap: 'wrap' }}>
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
        <Spacer h={10} />
        <Row style={{ gap: 8 }}>
          {roomPalette.map((c) => (
            <Pressable
              key={c}
              onPress={() => {
                tap();
                setColor(c);
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: colors.ink,
              }}
            />
          ))}
        </Row>

        <Spacer h={18} />
        <T v="over">Deadline</T>
        <Spacer h={8} />
        <Row style={{ gap: 7 }}>
          {([3, 7, 14, 30] as const).map((d) => (
            <Chip key={d} small label={`${d} days`} active={days === d} onPress={() => setDays(d)} />
          ))}
        </Row>

        <Spacer h={20} />
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="over">Pick tasks from your rooms</T>
          <View
            style={{
              backgroundColor: colors.sageSoft,
              borderRadius: radius.pill,
              paddingHorizontal: 9,
              paddingVertical: 3,
            }}
          >
            <T v="caption" color={colors.sageDeep}>
              {picked.length} selected
            </T>
          </View>
        </Row>
        <Spacer h={8} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search your chores"
          placeholderTextColor={colors.inkMuted}
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.line,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontFamily: font.medium,
            fontSize: 14,
            color: colors.ink,
          }}
        />
        <Spacer h={8} />
        {rooms.map((room) => {
          const list = filtered.filter((t) => t.roomId === room.id);
          if (!list.length) return null;
          return (
            <View key={room.id}>
              <Row style={{ gap: 7, marginTop: 12, marginBottom: 2 }}>
                <View
                  style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: room.color }}
                />
                <T v="over" color={room.color}>
                  {room.name}
                </T>
              </Row>
              {list.map((t) => {
                const on = picked.includes(t.id);
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => {
                      tap();
                      setPicked((p) => (on ? p.filter((x) => x !== t.id) : [...p, t.id]));
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 11,
                      paddingVertical: 9,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: on ? room.color : colors.line,
                        backgroundColor: on ? room.color : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {on ? <Ionicons name="checkmark" size={12} color="#FFF" /> : null}
                    </View>
                    <T v="body" style={{ flex: 1, fontSize: 14 }}>
                      {t.name}
                    </T>
                  </Pressable>
                );
              })}
            </View>
          );
        })}

        <Spacer h={20} />
        <T v="over">One-off items</T>
        <Spacer h={4} />
        <T v="caption">
          Things that aren't real chores — "call the landlord", "find the spare keys". They live
          inside this challenge only.
        </T>
        <Spacer h={8} />
        <Row style={{ gap: 8 }}>
          <TextInput
            value={oneOffDraft}
            onChangeText={setOneOffDraft}
            placeholder="Add an item"
            placeholderTextColor={colors.inkMuted}
            onSubmitEditing={() => {
              if (!oneOffDraft.trim()) return;
              setOneOffs((o) => [...o, oneOffDraft.trim()]);
              setOneOffDraft('');
            }}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.line,
              paddingHorizontal: 14,
              paddingVertical: 11,
              fontFamily: font.medium,
              fontSize: 14,
              color: colors.ink,
            }}
          />
          <Btn
            small
            label="Add"
            full={false}
            onPress={() => {
              if (!oneOffDraft.trim()) return;
              setOneOffs((o) => [...o, oneOffDraft.trim()]);
              setOneOffDraft('');
            }}
          />
        </Row>
        {oneOffs.length ? (
          <>
            <Spacer h={8} />
            <Row style={{ flexWrap: 'wrap', gap: 7 }}>
              {oneOffs.map((o, i) => (
                <Chip
                  key={`${o}-${i}`}
                  small
                  label={`${o}  ×`}
                  onPress={() => setOneOffs((list) => list.filter((_, x) => x !== i))}
                />
              ))}
            </Row>
          </>
        ) : null}

        <Spacer h={22} />
        <Card soft>
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="heading">Reward</T>
            <T v="heading" color={colors.gold}>
              {reward} coins
            </T>
          </Row>
          <Spacer h={4} />
          <T v="caption">Five coins an item, capped at 200.</T>
        </Card>

        <Spacer h={16} />
        <Btn
          label="Create and join"
          disabled={!name.trim() || total === 0}
          onPress={() => {
            const id = create({
              name: name.trim(),
              emoji,
              color,
              days,
              taskIds: picked,
              oneOffs,
            });
            join(id);
            router.replace(`/challenge/${id}`);
          }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
