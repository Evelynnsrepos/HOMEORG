import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, useWindowDimensions } from 'react-native';

import { itemById, shopItems } from '../../src/data/shop';
import { useRooms } from '../../src/state/derived';
import { useStore } from '../../src/state/store';
import { colors, radius, shadow } from '../../src/theme';
import { Btn, Card, Empty, Press, Row, Screen, Spacer, T } from '../../src/ui/base';
import { FurnitureTile } from '../../src/ui/Furniture';
import { RoomCanvas } from '../../src/ui/RoomCanvas';


export default function MyHome() {
  const { width: W } = useWindowDimensions();
  const router = useRouter();
  const rooms = useRooms();
  const coins = useStore((s) => s.coins);
  const inventory = useStore((s) => s.inventory);

  const placed = rooms.reduce(
    (n, r) => n + (r.room.decor ?? []).filter(Boolean).length,
    0,
  );
  const unplaced = inventory.filter(
    (id) => !rooms.some((r) => (r.room.decor ?? []).includes(id)),
  );

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <T v="display" style={{ fontSize: 30 }}>
            My Home
            <T v="display" color={colors.gold} style={{ fontSize: 30 }}>
              .
            </T>
          </T>
          <Spacer h={4} />
          <T v="label">Clean for real, decorate in here.</T>
        </View>
        <Row
          style={{
            backgroundColor: colors.goldSoft,
            borderRadius: radius.pill,
            paddingHorizontal: 12,
            paddingVertical: 7,
            gap: 6,
          }}
        >
          <Ionicons name="ellipse" size={13} color={colors.gold} />
          <T v="heading" style={{ fontSize: 14 }} color="#8A6B1F">
            {coins}
          </T>
        </Row>
      </Row>

      <Spacer h={16} />
      <Row style={{ gap: 10 }}>
        <Btn style={{ flex: 1 }} label="Open the shop" icon="storefront" onPress={() => router.push('/shop')} />
      </Row>

      <Spacer h={14} />
      <Card soft style={{ padding: 14 }}>
        <Row style={{ justifyContent: 'space-around' }}>
          <Mini value={`${inventory.length}`} label="Owned" />
          <Mini value={`${placed}`} label="Placed" />
          <Mini value={`${shopItems.length - inventory.length}`} label="Left to find" />
        </Row>
      </Card>

      {unplaced.length ? (
        <>
          <Row style={{ marginTop: 22, justifyContent: 'space-between' }}>
            <T v="over">In your storage</T>
            <T v="caption">{unplaced.length} waiting</T>
          </Row>
          <Spacer h={8} />
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {unplaced.slice(0, 12).map((id) => {
              const item = itemById(id);
              if (!item) return null;
              return (
                <View
                  key={id}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: radius.md,
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.lineSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FurnitureTile kind={item.kind} palette={item.palette} size={52} />
                </View>
              );
            })}
          </Row>
          <Spacer h={6} />
          <T v="caption">Open a room below to put these somewhere.</T>
        </>
      ) : null}

      <Spacer h={22} />
      <T v="over">Your rooms</T>
      <Spacer h={10} />

      {rooms.length === 0 ? (
        <Empty emoji={'\u{1F3E1}'} title="No rooms yet" body="Add a room on the Home tab first." />
      ) : (
        rooms.map(({ room, health }) => (
          <Press
            key={room.id}
            onPress={() => router.push(`/decorate/${room.id}`)}
            style={{
              marginBottom: 14,
              borderRadius: radius.lg,
              overflow: 'hidden',
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.lineSoft,
              ...shadow.card,
            }}
          >
            <RoomCanvas room={room} width={W - 34} dim={Math.max(0, (70 - health) / 100)} />
            <Row style={{ padding: 14, justifyContent: 'space-between' }}>
              <View>
                <T v="heading">
                  {room.emoji} {room.name}
                </T>
                <T v="caption">
                  {(room.decor ?? []).filter(Boolean).length} of 10 slots filled
                </T>
              </View>
              <Row style={{ gap: 5 }}>
                <T v="label" color={colors.coralDeep}>
                  Decorate
                </T>
                <Ionicons name="chevron-forward" size={15} color={colors.coralDeep} />
              </Row>
            </Row>
          </Press>
        ))
      )}
    </Screen>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <T v="title" style={{ fontSize: 20 }}>
        {value}
      </T>
      <T v="caption">{label}</T>
    </View>
  );
}
