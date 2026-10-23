import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, useWindowDimensions } from 'react-native';

import { pieces } from '../../src/data/stickerCatalog';
import { pieceById } from '../../src/lib/stickers';
import { PieceImage } from '../../src/ui/StickerLayer';
import { useRooms } from '../../src/state/derived';
import { useStore } from '../../src/state/store';
import { colors, radius, shadow } from '../../src/theme';
import { Btn, Card, Empty, Press, Row, Screen, Spacer, T } from '../../src/ui/base';
import { FurnitureTile } from '../../src/ui/Furniture';
import { RoomCanvas } from '../../src/ui/RoomCanvas';
import { ScreenGarland } from '../../src/ui/Decor';


export default function MyHome() {
  const { width: W } = useWindowDimensions();
  const router = useRouter();
  const rooms = useRooms();
  const coins = useStore((s) => s.coins);
  const inventory = useStore((s) => s.inventory);
  const owned = useStore((s) => s.pieces ?? []);

  const placed = rooms.reduce((n, r) => n + (r.room.stickers ?? []).length, 0);
  // the newest pieces first: what you most likely want to stick somewhere
  const newest = [...owned].reverse().slice(0, 12);

  return (
    <Screen>
      <ScreenGarland seed={5} />
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
        <Btn style={{ flex: 1 }} label="Draw stickers" icon="sparkles" onPress={() => router.push('/shop')} />
      </Row>
      <Spacer h={8} />
      <Row style={{ gap: 8 }}>
        <Btn
          style={{ flex: 1 }}
          small
          tone="quiet"
          icon="grid-outline"
          label="Rooms and floors"
          onPress={() => router.push('/layout')}
        />
        <Btn
          style={{ flex: 1 }}
          small
          tone="quiet"
          icon="home-outline"
          label="House view"
          onPress={() => router.push('/house')}
        />
      </Row>

      <Spacer h={14} />
      <Card soft style={{ padding: 14 }}>
        <Row style={{ justifyContent: 'space-around' }}>
          <Mini value={`${owned.length + inventory.length}`} label="Stickers" />
          <Mini value={`${placed}`} label="Stuck on" />
          <Mini value={`${pieces.length - owned.length}`} label="Left to find" />
        </Row>
      </Card>

      {newest.length ? (
        <>
          <Row style={{ marginTop: 22, justifyContent: 'space-between' }}>
            <T v="over">Newest in your collection</T>
            <T v="caption">{owned.length} pixel pieces</T>
          </Row>
          <Spacer h={8} />
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {newest.map((id) => (
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
                <PieceImage piece={id} width={Math.min(50, 50 * (pieceShape(id) || 1))} />
              </View>
            ))}
          </Row>
          <Spacer h={6} />
          <T v="caption">Open a room below to stick these anywhere.</T>
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
                  {(room.stickers ?? []).length} {(room.stickers ?? []).length === 1 ? 'sticker' : 'stickers'}
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

/** Width over height for a tall piece, so it fits its square; 1 for wide ones. */
function pieceShape(id: string): number {
  const p = pieceById(id);
  if (!p || p.type !== 'pixel') return 1;
  return Math.min(1, p.piece.w / p.piece.h);
}
