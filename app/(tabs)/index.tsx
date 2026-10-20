import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useHomeHealth, useRooms, useStreak, useToday } from '../../src/state/derived';
import { useStore } from '../../src/state/store';
import { band, bandColor, bandLabel, colors, font, radius, shadow } from '../../src/theme';
import { Bar, Card, EmojiTile, Press, Ring, Row, Screen, Spacer, T, tap } from '../../src/ui/base';
import { RoomCanvas } from '../../src/ui/RoomCanvas';


export default function HomeTab() {
  const { width: W } = useWindowDimensions();
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const coins = useStore((s) => s.coins);
  const notes = useStore((s) => s.notes);
  const shopping = useStore((s) => s.shopping);
  const pantry = useStore((s) => s.pantry);
  const rooms = useRooms();
  const health = useHomeHealth();
  const streak = useStreak();
  const plan = useToday();
  const [view, setView] = useState<'dollhouse' | 'list'>('dollhouse');

  const dueCount = plan.tasks.length;
  const b = band(health);

  const byFloor = settings.floors.map((floorName, i) => ({
    name: floorName,
    rooms: rooms.filter((r) => r.room.floor === i),
  }));

  // screen padding, dollhouse padding, the floor rail, then the gap between cards
  const inner = W - 32 - 14 - (settings.floors.length > 1 ? 26 : 0);
  const cardW = Math.floor((inner - 7) / 2) - 1;

  return (
    <Screen>
      {/* Header ---------------------------------------------------- */}
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ gap: 8 }}>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              backgroundColor: colors.sageSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="home" size={15} color={colors.sageDeep} />
          </View>
          <T v="title" style={{ fontSize: 19 }}>
            Homeorg&lt;3
          </T>
        </Row>
        <Row style={{ gap: 7 }}>
          <Press onPress={() => router.push('/shop')}>
            <Row
              style={{
                backgroundColor: colors.goldSoft,
                borderRadius: radius.pill,
                paddingHorizontal: 9,
                paddingVertical: 5,
                gap: 4,
              }}
            >
              <Ionicons name="ellipse" size={11} color={colors.gold} />
              <T v="heading" style={{ fontSize: 12.5 }} color="#8A6B1F">
                {coins}
              </T>
            </Row>
          </Press>
          <Row
            style={{
              backgroundColor: colors.coralSoft,
              borderRadius: radius.pill,
              paddingHorizontal: 9,
              paddingVertical: 5,
              gap: 4,
            }}
          >
            <Ionicons name="flame" size={12} color={colors.ember} />
            <T v="heading" style={{ fontSize: 12.5 }} color="#A64B32">
              {streak}
            </T>
          </Row>
          <Press onPress={() => router.push('/(tabs)/profile')}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.coral,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <T v="heading" color="#FFF8F2" style={{ fontSize: 13 }}>
                {(settings.householdName || 'T').trim().charAt(0).toUpperCase()}
              </T>
            </View>
          </Press>
        </Row>
      </Row>

      {/* Title + ring ---------------------------------------------- */}
      <Row style={{ marginTop: 18, alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <T v="display" style={{ fontSize: 28, lineHeight: 32 }}>
            {settings.householdName}
          </T>
          <Spacer h={4} />
          <T v="label">
            {health}% freshly cleaned ·{' '}
            {settings.vacation
              ? 'Vacation mode'
              : dueCount === 0
                ? 'All done!'
                : `${dueCount} on today`}
          </T>
          <Spacer h={10} />
          <Pressable
            onPress={() => {
              tap();
              setView((v) => (v === 'dollhouse' ? 'list' : 'dollhouse'));
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.pill,
              paddingHorizontal: 11,
              paddingVertical: 6,
            }}
          >
            <Ionicons name="eye-outline" size={13} color={colors.inkSoft} />
            <T v="label" style={{ fontSize: 12 }}>
              View: {view === 'dollhouse' ? 'Dollhouse' : 'List'}
            </T>
          </Pressable>
        </View>
        <Ring pct={health} size={80} stroke={9} color={bandColor[b]}>
          <T v="title" style={{ fontSize: 20 }}>
            {health}
            <T v="caption" style={{ fontSize: 11 }}>
              %
            </T>
          </T>
          <T v="caption" style={{ fontSize: 9 }}>
            {bandLabel[b]}
          </T>
        </Ring>
      </Row>

      <Spacer h={18} />

      {/* Dollhouse -------------------------------------------------- */}
      {view === 'dollhouse' ? (
        <View>
          <Roof width={W - 32} />
          <View style={{ height: 6, backgroundColor: colors.cardAlt, marginTop: -1 }} />

          <View
            style={{
              backgroundColor: colors.cardAlt,
              borderWidth: 1,
              borderColor: colors.line,
              borderBottomLeftRadius: radius.lg,
              borderBottomRightRadius: radius.lg,
              padding: 7,
              gap: 7,
            }}
          >
            {byFloor.map((floor) =>
              floor.rooms.length === 0 && settings.floors.length > 1 ? null : (
                <View key={floor.name} style={{ flexDirection: 'row', gap: 6 }}>
                  {settings.floors.length > 1 ? (
                    <View
                      style={{
                        width: 20,
                        backgroundColor: colors.bgDeep,
                        borderRadius: 8,
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View
                        style={{
                          position: 'absolute',
                          width: 140,
                          alignItems: 'center',
                          transform: [{ rotate: '-90deg' }],
                        }}
                      >
                        <T v="over" style={{ fontSize: 8 }} numberOfLines={1}>
                          {floor.name}
                        </T>
                      </View>
                    </View>
                  ) : null}
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 7,
                    }}
                  >
                    {floor.rooms.map(({ room, health: h }) => {
                      const rb = band(h);
                      const w = cardW;
                      return (
                        <Press
                          key={room.id}
                          onPress={() => router.push(`/room/${room.id}`)}
                          style={{
                            width: w,
                            borderRadius: 12,
                            overflow: 'hidden',
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.lineSoft,
                          }}
                        >
                          <View>
                            <RoomCanvas
                              room={room}
                              width={w - 2}
                              dim={Math.max(0, (70 - h) / 100)}
                            />
                            <View
                              style={{
                                position: 'absolute',
                                top: 5,
                                left: 5,
                                backgroundColor: '#FFFDF8EE',
                                borderRadius: radius.pill,
                                paddingHorizontal: 6,
                                paddingVertical: 2.5,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <View
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: 3,
                                  backgroundColor: bandColor[rb],
                                }}
                              />
                              <T v="over" style={{ fontSize: 7.5 }} color={colors.inkSoft}>
                                {bandLabel[rb]}
                              </T>
                            </View>
                          </View>
                          <View style={{ padding: 8 }}>
                            <Row style={{ justifyContent: 'space-between' }}>
                              <T v="heading" style={{ fontSize: 12.5, flex: 1 }} numberOfLines={1}>
                                {room.emoji} {room.name}
                              </T>
                              <T v="caption" color={bandColor[rb]} style={{ fontSize: 10.5 }}>
                                {h}%
                              </T>
                            </Row>
                            <Spacer h={5} />
                            <Bar pct={h} color={bandColor[rb]} height={4} />
                          </View>
                        </Press>
                      );
                    })}
                  </View>
                </View>
              ),
            )}

            <Press
              onPress={() => router.push('/room/new')}
              style={{
                alignSelf: 'center',
                backgroundColor: colors.card,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.line,
                paddingHorizontal: 14,
                paddingVertical: 7,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                marginTop: 2,
              }}
            >
              <Ionicons name="add" size={14} color={colors.inkSoft} />
              <T v="label" style={{ fontSize: 12.5 }}>
                Add a room
              </T>
            </Press>
          </View>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {rooms.map(({ room, health: h, tasks }) => {
            const rb = band(h);
            return (
              <Press key={room.id} onPress={() => router.push(`/room/${room.id}`)}>
                <Card style={{ padding: 12 }}>
                  <Row>
                    <EmojiTile emoji={room.emoji} size={40} bg={colors.cardAlt} />
                    <View style={{ flex: 1 }}>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <T v="heading">{room.name}</T>
                        <T v="label" color={bandColor[rb]}>
                          {h}%
                        </T>
                      </Row>
                      <T v="caption">
                        {tasks.length} chores · {bandLabel[rb]}
                      </T>
                      <Spacer h={6} />
                      <Bar pct={h} color={bandColor[rb]} />
                    </View>
                  </Row>
                </Card>
              </Press>
            );
          })}
        </View>
      )}

      {/* Quick actions ---------------------------------------------- */}
      <Spacer h={14} />
      <Row style={{ gap: 10 }}>
        <QuickTile
          icon="bookmark"
          tint="#EFC8B8"
          title="Pinned info"
          sub={`${notes.length} ${notes.length === 1 ? 'note' : 'notes'}`}
          onPress={() => router.push('/notes')}
        />
        <QuickTile
          icon="cart"
          tint="#CFE1E6"
          title="Shopping list"
          sub={`${shopping.filter((s) => !s.done).length} to buy`}
          onPress={() => router.push('/shopping')}
        />
      </Row>
      <Spacer h={10} />
      <Row style={{ gap: 10 }}>
        <QuickTile
          icon="disc"
          tint="#F4D8C8"
          title="Focus"
          sub="One task at a time"
          onPress={() => router.push('/focus')}
        />
        <QuickTile
          icon="timer"
          tint="#DDEBE0"
          title="Sprint"
          sub="15 · 25 · 45 min"
          onPress={() => router.push('/sprint')}
        />
      </Row>
      <Spacer h={10} />
      <Row style={{ gap: 10 }}>
        <QuickTile
          icon="trophy"
          tint="#F8E9C8"
          title="Challenges"
          sub="16 checklists"
          onPress={() => router.push('/challenges')}
        />
        <QuickTile
          icon="restaurant"
          tint="#E7E2F2"
          title="Kitchen"
          sub={`${pantry.length} in the cupboards`}
          onPress={() => router.push('/recipes')}
        />
      </Row>
    </Screen>
  );
}

/** A pitched roof with a chimney and a lit attic window, drawn to fit the width. */
function Roof({ width }: { width: number }) {
  const h = width * 0.13;
  const eave = h * 0.34;
  return (
    <Svg width={width} height={h} style={{ marginBottom: -1 }}>
      <Path
        d={`M${width / 2},2 L${width - 4},${h - eave} L${width - 4},${h} L4,${h} L4,${h - eave} Z`}
        fill={colors.sageDeep}
      />
      <Path
        d={`M${width / 2},2 L${width - 4},${h - eave} L4,${h - eave} Z`}
        fill={colors.sage}
      />
      <Rect
        x={width * 0.7}
        y={h * 0.12}
        width={width * 0.055}
        height={h * 0.55}
        rx={3}
        fill={colors.sageDeep}
      />
      <Circle cx={width / 2} cy={h * 0.66} r={h * 0.14} fill="#F6E7C4" />
      <Circle cx={width / 2} cy={h * 0.66} r={h * 0.14} fill="none" stroke={colors.sageDeep} strokeWidth={2} />
    </Svg>
  );
}

function QuickTile({
  icon,
  title,
  sub,
  tint,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Press
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.lineSoft,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        ...shadow.card,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: tint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={16} color={colors.espresso} />
      </View>
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: font.bold, fontSize: 13, color: colors.ink }}>{title}</T>
        <T v="caption" numberOfLines={1}>
          {sub}
        </T>
      </View>
    </Press>
  );
}
