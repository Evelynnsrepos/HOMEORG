import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { homeTypes, roomTypes } from '../src/data/roomTypes';
import { NewRoomInput, useStore } from '../src/state/store';
import { colors, radius } from '../src/theme';
import {
  Bar,
  Btn,
  Card,
  Chip,
  EmojiTile,
  IconBtn,
  Press,
  Row,
  Screen,
  Spacer,
  T,
  tap,
} from '../src/ui/base';
import { Field } from '../src/ui/TaskFields';

type Mode = 'layout' | 'choose' | 'remodel' | 'moved';

export default function HomeLayout() {
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const rooms = useStore((s) => s.rooms);
  const patch = useStore((s) => s.patchSettings);
  const reorder = useStore((s) => s.reorderRooms);
  const remodel = useStore((s) => s.remodel);
  const moveHouse = useStore((s) => s.moveHouse);

  const [mode, setMode] = useState<Mode>('layout');
  const [name, setName] = useState(settings.householdName);
  const [homeType, setHomeType] = useState(settings.homeType);
  const [assign, setAssign] = useState<Record<string, number>>(
    Object.fromEntries(rooms.map((r) => [r.id, r.floor])),
  );
  const [counts, setCounts] = useState<Record<string, number>>({
    kitchen: 1,
    living: 1,
    bathroom: 1,
    bedroom: 1,
  });

  const floors = homeTypes.find((h) => h.id === homeType)?.floors ?? ['Home'];
  const ordered = useMemo(() => [...rooms].sort((a, b) => a.order - b.order), [rooms]);

  const newRooms: NewRoomInput[] = useMemo(() => {
    const out: NewRoomInput[] = [];
    for (const rt of roomTypes) {
      const n = counts[rt.id] ?? 0;
      for (let i = 0; i < n; i++) {
        out.push({
          typeId: rt.id,
          name: n > 1 ? `${rt.name} ${i + 1}` : rt.name,
          emoji: rt.emoji,
          floor: 0,
          condition: 0.5,
          chores: rt.chores
            .filter((c) => c.on)
            .map((c) => ({
              name: c.name,
              minutes: c.minutes,
              effort: c.effort,
              every: c.every,
              unit: c.unit,
            })),
        });
      }
    }
    return out;
  }, [counts]);

  function move(id: string, dir: -1 | 1) {
    tap();
    const ids = ordered.map((r) => r.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorder(ids);
  }

  /* ---- Home layout ------------------------------------------------ */
  if (mode === 'layout') {
    return (
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => router.back()} />
          <T v="heading">Home layout</T>
          <View style={{ width: 38 }} />
        </Row>

        <Spacer h={16} />
        <Card>
          <Field label="Household name" value={name} onChangeText={setName} />
          <Spacer h={12} />
          <Row style={{ gap: 10 }}>
            <Btn
              small
              label="Save"
              full={false}
              disabled={name.trim() === settings.householdName}
              onPress={() => patch({ householdName: name.trim() })}
            />
            {name.trim() !== settings.householdName ? (
              <Press onPress={() => setName(settings.householdName)} style={{ padding: 8 }}>
                <T v="label" color={colors.inkMuted}>
                  Cancel
                </T>
              </Press>
            ) : null}
          </Row>
        </Card>

        <Spacer h={18} />
        <T v="over">Your rooms</T>
        <Spacer h={8} />
        {ordered.map((room, i) => (
          <Card key={room.id} style={{ padding: 12, marginBottom: 8 }}>
            <Row style={{ gap: 12 }}>
              <EmojiTile emoji={room.emoji} size={36} bg={colors.cardAlt} />
              <Press style={{ flex: 1 }} onPress={() => router.push(`/room/edit/${room.id}`)}>
                <T v="heading" style={{ fontSize: 14.5 }}>
                  {room.name}
                </T>
                <T v="caption">{settings.floors[room.floor] ?? 'Home'}</T>
              </Press>
              <Row style={{ gap: 0 }}>
                <IconBtn
                  name="chevron-up"
                  size={16}
                  onPress={() => move(room.id, -1)}
                  color={i === 0 ? colors.lineSoft : colors.inkMuted}
                />
                <IconBtn
                  name="chevron-down"
                  size={16}
                  onPress={() => move(room.id, 1)}
                  color={i === ordered.length - 1 ? colors.lineSoft : colors.inkMuted}
                />
              </Row>
            </Row>
          </Card>
        ))}

        <Spacer h={8} />
        <Press
          onPress={() => router.push('/room/new')}
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
            Add a room
          </T>
        </Press>

        <Spacer h={22} />
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Press onPress={() => setMode('choose')}>
            <Row style={{ padding: 15, gap: 13 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: colors.coralSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="construct" size={15} color={colors.coralDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="heading" style={{ fontSize: 14.5 }}>
                  Restructure home
                </T>
                <T v="caption">Change the floors, or start fresh after a move</T>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </Row>
          </Press>
        </Card>
      </Screen>
    );
  }

  /* ---- Choose a path ---------------------------------------------- */
  if (mode === 'choose') {
    return (
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => setMode('layout')} />
          <T v="heading">Restructure</T>
          <View style={{ width: 38 }} />
        </Row>
        <Spacer h={14} />
        <T v="display" style={{ fontSize: 26 }}>
          How are you{'\n'}changing things?
        </T>
        <Spacer h={6} />
        <T v="body">One keeps your history, one starts fresh.</T>
        <Spacer h={18} />

        <Press onPress={() => setMode('remodel')}>
          <Card style={{ marginBottom: 12 }}>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: colors.sageSoft,
                borderRadius: radius.pill,
                paddingHorizontal: 9,
                paddingVertical: 3,
              }}
            >
              <T v="over" style={{ fontSize: 8.5 }} color={colors.sageDeep}>
                Keeps history
              </T>
            </View>
            <Spacer h={9} />
            <T v="title" style={{ fontSize: 19 }}>
              Remodelling
            </T>
            <Spacer h={4} />
            <T v="body">
              Change your home type and floor layout. Every room, chore and completed job stays
              exactly where it was.
            </T>
          </Card>
        </Press>

        <Press onPress={() => setMode('moved')}>
          <Card>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: colors.coralSoft,
                borderRadius: radius.pill,
                paddingHorizontal: 9,
                paddingVertical: 3,
              }}
            >
              <T v="over" style={{ fontSize: 8.5 }} color={colors.coralDeep}>
                Starts fresh
              </T>
            </View>
            <Spacer h={9} />
            <T v="title" style={{ fontSize: 19 }}>
              We moved house
            </T>
            <Spacer h={4} />
            <T v="body">
              A new home, a clean slate. Your rooms, chores and their history are replaced. Coins,
              streaks and furniture stay with you.
            </T>
          </Card>
        </Press>
      </Screen>
    );
  }

  /* ---- Remodel ----------------------------------------------------- */
  if (mode === 'remodel') {
    return (
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => setMode('choose')} />
          <T v="heading">Remodelling</T>
          <View style={{ width: 38 }} />
        </Row>
        <Spacer h={14} />
        <T v="over">Home type</T>
        <Spacer h={8} />
        <Row style={{ gap: 7, flexWrap: 'wrap' }}>
          {homeTypes.map((h) => (
            <Chip
              key={h.id}
              small
              label={`${h.emoji} ${h.name}`}
              active={homeType === h.id}
              onPress={() => setHomeType(h.id)}
            />
          ))}
        </Row>

        <Spacer h={20} />
        <T v="over">Put each room on a floor</T>
        <Spacer h={10} />
        {ordered.map((room) => (
          <Row key={room.id} style={{ marginBottom: 10, gap: 10 }}>
            <EmojiTile emoji={room.emoji} size={32} bg={colors.cardAlt} />
            <T v="heading" style={{ flex: 1, fontSize: 14 }}>
              {room.name}
            </T>
            <Row style={{ gap: 5, flexWrap: 'wrap' }}>
              {floors.map((f, i) => (
                <Chip
                  key={f}
                  small
                  label={f}
                  active={(assign[room.id] ?? 0) === i}
                  onPress={() => setAssign((a) => ({ ...a, [room.id]: i }))}
                />
              ))}
            </Row>
          </Row>
        ))}

        <Spacer h={22} />
        <HoldToApply
          label="Hold to remodel"
          onDone={() => {
            const clamped = Object.fromEntries(
              Object.entries(assign).map(([k, v]) => [k, Math.min(v, floors.length - 1)]),
            );
            remodel(homeType, floors, clamped);
            setMode('layout');
          }}
        />
      </Screen>
    );
  }

  /* ---- Moved house -------------------------------------------------- */
  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => setMode('choose')} />
        <T v="heading">We moved house</T>
        <View style={{ width: 38 }} />
      </Row>
      <Spacer h={14} />
      <Card soft>
        <T v="heading">This deletes your current rooms</T>
        <Spacer h={4} />
        <T v="body">
          Rooms, chores, completion history and photos go for good. Coins, streaks, furniture and
          the whole kitchen — recipes, shopping list, pantry — stay.
        </T>
      </Card>

      <Spacer h={18} />
      <T v="over">New home type</T>
      <Spacer h={8} />
      <Row style={{ gap: 7, flexWrap: 'wrap' }}>
        {homeTypes.map((h) => (
          <Chip
            key={h.id}
            small
            label={`${h.emoji} ${h.name}`}
            active={homeType === h.id}
            onPress={() => setHomeType(h.id)}
          />
        ))}
      </Row>

      <Spacer h={20} />
      <T v="over">Rooms in the new place</T>
      <Spacer h={8} />
      {roomTypes
        .filter((r) => r.id !== 'custom')
        .map((rt) => {
          const n = counts[rt.id] ?? 0;
          return (
            <Row key={rt.id} style={{ paddingVertical: 7, gap: 10 }}>
              <EmojiTile emoji={rt.emoji} size={32} bg={colors.cardAlt} />
              <T v="heading" style={{ flex: 1, fontSize: 14 }}>
                {rt.name}
              </T>
              <Row style={{ gap: 4 }}>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    tap();
                    setCounts((c) => ({ ...c, [rt.id]: Math.max(0, (c[rt.id] ?? 0) - 1) }));
                  }}
                  style={stepper(colors.cardAlt)}
                >
                  <Ionicons name="remove" size={15} color={colors.ink} />
                </Pressable>
                <T v="heading" style={{ width: 20, textAlign: 'center' }}>
                  {n}
                </T>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    tap();
                    setCounts((c) => ({ ...c, [rt.id]: Math.min(6, (c[rt.id] ?? 0) + 1) }));
                  }}
                  style={stepper(colors.sageSoft)}
                >
                  <Ionicons name="add" size={15} color={colors.sageDeep} />
                </Pressable>
              </Row>
            </Row>
          );
        })}

      <Spacer h={14} />
      <T v="caption">
        {newRooms.length} rooms ·{' '}
        {newRooms.reduce((s, r) => s + r.chores.length, 0)} usual chores, ready on Today.
      </T>

      <Spacer h={20} />
      <HoldToApply
        label="Hold to move in"
        tone={colors.coral}
        disabled={!newRooms.length}
        onDone={() => {
          moveHouse(homeType, floors, newRooms);
          setMode('layout');
        }}
      />
    </Screen>
  );
}

const stepper = (bg: string) =>
  ({
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: bg,
    alignItems: 'center',
    justifyContent: 'center',
  }) as const;

/** Nothing is applied until you hold it. Letting go early cancels. */
function HoldToApply({
  label,
  onDone,
  tone = colors.sage,
  disabled,
}: {
  label: string;
  onDone: () => void;
  tone?: string;
  disabled?: boolean;
}) {
  const [pct, setPct] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  function start() {
    if (disabled) return;
    tap();
    timer.current = setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          if (timer.current) clearInterval(timer.current);
          onDone();
          return 0;
        }
        return p + 4;
      });
    }, 40);
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    setPct(0);
  }

  return (
    <View>
      <Pressable
        onPressIn={start}
        onPressOut={stop}
        style={{
          backgroundColor: disabled ? colors.lineSoft : tone,
          borderRadius: radius.pill,
          paddingVertical: 16,
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <T v="heading" color="#FFF8F2">
          {'\u{1F9F9}'} {label}
        </T>
      </Pressable>
      <Spacer h={8} />
      <Bar pct={pct} color={tone} height={5} />
      <Spacer h={6} />
      <T v="caption" center>
        {pct > 0 ? 'Keep holding...' : 'Let go early and nothing happens.'}
      </T>
    </View>
  );
}
