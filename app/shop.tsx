import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';

import {
  rarityColor,
  rarityLabel,
  shopCategories,
  shopItems,
  type ShopItem,
} from '../src/data/shop';
import { useStore } from '../src/state/store';
import { colors, radius } from '../src/theme';
import { Btn, Card, Chip, IconBtn, Row, Screen, Spacer, T, tap, tapSuccess } from '../src/ui/base';
import { FurnitureTile } from '../src/ui/Furniture';
import { Toast } from '../src/ui/TaskRow';

const COLS = 3;
const GAP = 10;

export default function Shop() {
  const { width: W } = useWindowDimensions();
  const TILE = (W - 32 - GAP * (COLS - 1)) / COLS;
  const router = useRouter();
  const coins = useStore((s) => s.coins);
  const inventory = useStore((s) => s.inventory);
  const buyItem = useStore((s) => s.buyItem);

  const [cat, setCat] = useState('all');
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const list = useMemo(() => {
    if (cat === 'all') return shopItems;
    const kinds = shopCategories.find((c) => c.id === cat)?.kinds ?? [];
    return shopItems.filter((i) => kinds.includes(i.kind));
  }, [cat]);

  const owned = inventory.length;

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name="chevron-back" onPress={() => router.back()} />
          <T v="heading">The Shop</T>
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

        <Spacer h={10} />
        <T v="display" style={{ fontSize: 28 }}>
          {shopItems.length} things{'\n'}for your home.
        </T>
        <Spacer h={6} />
        <T v="label">
          {owned} owned · every chore you tick off pays for the next one.
        </T>

        <Spacer h={16} />
        <Row style={{ flexWrap: 'wrap', gap: 7 }}>
          <Chip small label="All" active={cat === 'all'} onPress={() => setCat('all')} />
          {shopCategories.map((c) => (
            <Chip
              key={c.id}
              small
              label={c.name}
              active={cat === c.id}
              onPress={() => setCat(c.id)}
            />
          ))}
        </Row>

        <Spacer h={16} />
        <Row style={{ flexWrap: 'wrap', gap: GAP }}>
          {list.map((item) => {
            const has = inventory.includes(item.id);
            const afford = coins >= item.price;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  tap();
                  setSelected(item);
                }}
                style={{
                  width: TILE,
                  borderRadius: radius.md,
                  backgroundColor: colors.card,
                  borderWidth: 1.5,
                  borderColor: has ? colors.sage : colors.lineSoft,
                  padding: 8,
                  alignItems: 'center',
                  opacity: has || afford ? 1 : 0.55,
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: rarityColor[item.rarity],
                  }}
                />
                {has ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={colors.sage}
                    style={{ position: 'absolute', top: 5, right: 5 }}
                  />
                ) : null}
                <FurnitureTile kind={item.kind} palette={item.palette} size={TILE - 30} />
                <T v="caption" center numberOfLines={2} style={{ fontSize: 10, minHeight: 26 }}>
                  {item.name}
                </T>
                {has ? (
                  <T v="caption" color={colors.sage} style={{ fontSize: 10 }}>
                    Owned
                  </T>
                ) : (
                  <Row style={{ gap: 3 }}>
                    <Ionicons name="ellipse" size={8} color={colors.gold} />
                    <T v="caption" style={{ fontSize: 10.5 }} color="#8A6B1F">
                      {item.price}
                    </T>
                  </Row>
                )}
              </Pressable>
            );
          })}
        </Row>
      </Screen>

      {/* Detail sheet ------------------------------------------------ */}
      {selected ? (
        <Pressable
          onPress={() => setSelected(null)}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#2E2A25CC',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable onPress={() => {}}>
            <Card style={{ margin: 12, alignItems: 'center', paddingVertical: 22 }}>
              <FurnitureTile kind={selected.kind} palette={selected.palette} size={120} />
              <Spacer h={8} />
              <T v="title">{selected.name}</T>
              <Spacer h={4} />
              <Row style={{ gap: 6 }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: rarityColor[selected.rarity],
                  }}
                />
                <T v="caption" color={rarityColor[selected.rarity]}>
                  {rarityLabel[selected.rarity]}
                </T>
                <T v="caption">·</T>
                <T v="caption">{selected.zone === 'wall' ? 'Goes on a wall' : 'Stands on the floor'}</T>
              </Row>
              <Spacer h={16} />
              {inventory.includes(selected.id) ? (
                <Btn
                  label="Already yours — go and place it"
                  tone="quiet"
                  onPress={() => {
                    setSelected(null);
                    router.push('/(tabs)/myhome');
                  }}
                  style={{ alignSelf: 'stretch' }}
                />
              ) : (
                <Btn
                  label={`Buy for ${selected.price} coins`}
                  disabled={coins < selected.price}
                  style={{ alignSelf: 'stretch' }}
                  onPress={() => {
                    if (buyItem(selected.id)) {
                      tapSuccess();
                      setToast(`${selected.name} is yours`);
                      setTimeout(() => setToast(null), 2600);
                    }
                    setSelected(null);
                  }}
                />
              )}
              {!inventory.includes(selected.id) && coins < selected.price ? (
                <>
                  <Spacer h={8} />
                  <T v="caption" center>
                    {selected.price - coins} coins to go. Tick a few chores off.
                  </T>
                </>
              ) : null}
            </Card>
          </Pressable>
        </Pressable>
      ) : null}

      {toast ? <Toast text={toast} bottom={30} /> : null}
    </View>
  );
}
