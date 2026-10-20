import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';

import { floorings, itemById, wallpapers } from '../../src/data/shop';
import { useStore } from '../../src/state/store';
import { colors, radius } from '../../src/theme';
import { Btn, Card, Chip, Empty, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../../src/ui/base';
import { FurnitureTile } from '../../src/ui/Furniture';
import { RoomCanvas, SLOTS, slotAccepts } from '../../src/ui/RoomCanvas';


export default function Decorate() {
  const { width: W } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const room = useStore((s) => s.rooms.find((r) => r.id === id));
  const rooms = useStore((s) => s.rooms);
  const inventory = useStore((s) => s.inventory);
  const coins = useStore((s) => s.coins);
  const placeDecor = useStore((s) => s.placeDecor);
  const setSurface = useStore((s) => s.setSurface);

  const [slot, setSlot] = useState<number | null>(null);
  const [tab, setTab] = useState<'items' | 'walls' | 'floors'>('items');

  const usedElsewhere = useMemo(() => {
    const set = new Set<string>();
    for (const r of rooms) {
      if (r.id === id) continue;
      for (const d of r.decor ?? []) if (d) set.add(d);
    }
    return set;
  }, [rooms, id]);

  if (!room) {
    return (
      <Screen>
        <Empty emoji={'\u{1F6AA}'} title="Room not found" />
      </Screen>
    );
  }

  const available = inventory
    .map((i) => itemById(i))
    .filter((i): i is NonNullable<typeof i> => !!i)
    .filter((i) => !usedElsewhere.has(i.id))
    .filter((i) => (slot == null ? true : slotAccepts(SLOTS[slot], i.zone)));

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => router.back()} />
        <T v="heading">
          {room.emoji} {room.name}
        </T>
        <Row
          style={{
            backgroundColor: colors.goldSoft,
            borderRadius: radius.pill,
            paddingHorizontal: 10,
            paddingVertical: 5,
            gap: 5,
          }}
        >
          <Ionicons name="ellipse" size={11} color={colors.gold} />
          <T v="label" style={{ fontSize: 12 }} color="#8A6B1F">
            {coins}
          </T>
        </Row>
      </Row>

      <Spacer h={12} />
      <View
        style={{
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.line,
        }}
      >
        <RoomCanvas room={room} width={W - 34} editing activeSlot={slot} />
      </View>

      <Spacer h={12} />
      <T v="over">Ten slots — pick one</T>
      <Spacer h={8} />
      <Row style={{ flexWrap: 'wrap', gap: 6 }}>
        {SLOTS.map((s, i) => {
          const filled = !!(room.decor ?? [])[i];
          return (
            <Chip
              key={i}
              small
              label={s.hint}
              icon={filled ? 'checkmark-circle' : undefined}
              active={slot === i}
              tone={colors.coral}
              onPress={() => setSlot(slot === i ? null : i)}
            />
          );
        })}
      </Row>

      {slot != null && (room.decor ?? [])[slot] ? (
        <>
          <Spacer h={10} />
          <Btn
            small
            tone="quiet"
            label="Clear this slot"
            icon="close-circle-outline"
            onPress={() => placeDecor(room.id, slot, null)}
          />
        </>
      ) : null}

      <Spacer h={18} />
      <Row style={{ gap: 7 }}>
        <Chip small label="Furniture" active={tab === 'items'} onPress={() => setTab('items')} />
        <Chip small label="Wallpaper" active={tab === 'walls'} onPress={() => setTab('walls')} />
        <Chip small label="Flooring" active={tab === 'floors'} onPress={() => setTab('floors')} />
      </Row>
      <Spacer h={12} />

      {tab === 'items' ? (
        available.length === 0 ? (
          <Card soft>
            <T v="heading">
              {slot == null ? 'Nothing in storage yet' : 'Nothing fits that slot yet'}
            </T>
            <Spacer h={4} />
            <T v="body">
              Coins come from finishing chores. Spend them in the shop, then place what you buy
              here.
            </T>
            <Spacer h={12} />
            <Btn label="Open the shop" small onPress={() => router.push('/shop')} />
          </Card>
        ) : (
          <Row style={{ flexWrap: 'wrap', gap: 10 }}>
            {available.map((item) => {
              const here = (room.decor ?? []).indexOf(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    tap();
                    if (slot == null) {
                      const firstFree = SLOTS.findIndex(
                        (s, i) => !(room.decor ?? [])[i] && slotAccepts(s, item.zone),
                      );
                      if (firstFree >= 0) placeDecor(room.id, firstFree, item.id);
                      return;
                    }
                    placeDecor(room.id, slot, item.id);
                  }}
                  style={{
                    width: (W - 34 - 20) / 3,
                    borderRadius: radius.md,
                    backgroundColor: colors.card,
                    borderWidth: 1.5,
                    borderColor: here >= 0 ? colors.sage : colors.lineSoft,
                    padding: 8,
                    alignItems: 'center',
                  }}
                >
                  <FurnitureTile kind={item.kind} palette={item.palette} size={62} />
                  <T v="caption" center numberOfLines={2} style={{ fontSize: 10 }}>
                    {item.name}
                  </T>
                </Pressable>
              );
            })}
          </Row>
        )
      ) : null}

      {tab === 'walls' ? (
        <Row style={{ flexWrap: 'wrap', gap: 10 }}>
          {wallpapers.map((w) => {
            const active = room.wallpaper === w.id;
            return (
              <Press
                key={w.id}
                onPress={() => setSurface(room.id, 'wallpaper', w.id)}
                style={{
                  width: (W - 34 - 20) / 3,
                  borderRadius: radius.md,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: active ? colors.sage : colors.lineSoft,
                }}
              >
                <View style={{ height: 54, backgroundColor: w.base }}>
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 18,
                      backgroundColor: w.accent,
                    }}
                  />
                </View>
                <T v="caption" center style={{ paddingVertical: 5, fontSize: 10 }}>
                  {w.name}
                </T>
              </Press>
            );
          })}
        </Row>
      ) : null}

      {tab === 'floors' ? (
        <Row style={{ flexWrap: 'wrap', gap: 10 }}>
          {floorings.map((f) => {
            const active = room.flooring === f.id;
            return (
              <Press
                key={f.id}
                onPress={() => setSurface(room.id, 'flooring', f.id)}
                style={{
                  width: (W - 34 - 20) / 3,
                  borderRadius: radius.md,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: active ? colors.sage : colors.lineSoft,
                }}
              >
                <View style={{ height: 54, backgroundColor: f.base }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 18,
                      left: 0,
                      right: 0,
                      height: 3,
                      backgroundColor: f.accent,
                    }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      top: 34,
                      left: 0,
                      right: 0,
                      height: 3,
                      backgroundColor: f.accent,
                    }}
                  />
                </View>
                <T v="caption" center style={{ paddingVertical: 5, fontSize: 10 }}>
                  {f.name}
                </T>
              </Press>
            );
          })}
        </Row>
      ) : null}

      <Spacer h={16} />
      <T v="caption">
        Furniture lives in one room at a time — placing it here takes it out of wherever it was.
      </T>
    </Screen>
  );
}
