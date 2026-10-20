import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';

import { qtyLabel } from '../src/data/units';
import type { ShoppingItem } from '../src/lib/types';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Btn, Card, Empty, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../src/ui/base';
import { KitchenTabs } from '../src/ui/KitchenTabs';
import { QuantitySheet } from '../src/ui/QuantitySheet';

export default function Shopping() {
  const router = useRouter();
  const items = useStore((s) => s.shopping);
  const pantry = useStore((s) => s.pantry);
  const add = useStore((s) => s.addShopping);
  const toggle = useStore((s) => s.toggleShopping);
  const remove = useStore((s) => s.removeShopping);
  const clearDone = useStore((s) => s.clearDoneShopping);
  const addPantry = useStore((s) => s.addPantry);

  const [draft, setDraft] = useState('');
  const [bought, setBought] = useState<ShoppingItem | null>(null);

  const open = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  /** Already have some at home? Say so before they buy a fourth jar. */
  const inStock = (name: string) =>
    pantry.find((p) => {
      const a = p.name.trim().toLowerCase();
      const b = name.trim().toLowerCase();
      return a === b || a.includes(b) || b.includes(a);
    });

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Screen>
          <Row style={{ justifyContent: 'space-between' }}>
            <IconBtn
              name="chevron-back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
            <T v="heading">Kitchen</T>
            <View style={{ width: 38 }} />
          </Row>

          <Spacer h={12} />
          <KitchenTabs active="shopping" />

          <Spacer h={16} />
          <T v="display" style={{ fontSize: 28 }}>
            {open.length} to buy
            <T v="display" color={colors.coral} style={{ fontSize: 28 }}>
              .
            </T>
          </T>
          <Spacer h={6} />
          <T v="label">Tick something off and you can say how much you got.</T>

          <Spacer h={16} />
          <Row style={{ gap: 8 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Add something"
              placeholderTextColor={colors.inkMuted}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (!draft.trim()) return;
                add(draft.trim());
                setDraft('');
              }}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.line,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontFamily: font.medium,
                fontSize: 15,
                color: colors.ink,
              }}
            />
            <Btn
              small
              full={false}
              label="Add"
              onPress={() => {
                if (!draft.trim()) return;
                add(draft.trim());
                setDraft('');
              }}
            />
          </Row>

          <Spacer h={16} />
          {open.length === 0 && done.length === 0 ? (
            <Empty
              emoji={'\u{1F6D2}'}
              title="Nothing on the list"
              body="Add things here, or push a recipe's missing ingredients over from Recipes."
            />
          ) : null}

          {open.map((item) => {
            const have = inStock(item.name);
            return (
              <Card key={item.id} style={{ padding: 12, marginBottom: 8 }}>
                <Row style={{ gap: 12 }}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      tap();
                      toggle(item.id);
                      setBought(item);
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      borderWidth: 2,
                      borderColor: colors.line,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <T v="heading" style={{ fontSize: 14.5 }}>
                      {item.name}
                      {item.qty > 1 ? ` ×${item.qty}` : ''}
                    </T>
                    <Row style={{ gap: 6 }}>
                      {item.from ? <T v="caption">for {item.from}</T> : null}
                      {have ? (
                        <T v="caption" color={colors.sage}>
                          {item.from ? '· ' : ''}
                          {qtyLabel(have.qty, have.unit)} at home
                        </T>
                      ) : null}
                    </Row>
                  </View>
                  <Press onPress={() => remove(item.id)}>
                    <Ionicons name="close" size={16} color={colors.inkMuted} />
                  </Press>
                </Row>
              </Card>
            );
          })}

          {done.length ? (
            <>
              <Row style={{ justifyContent: 'space-between', marginTop: 14, marginBottom: 8 }}>
                <T v="over">In the trolley</T>
                <Press onPress={clearDone}>
                  <T v="caption" color={colors.coralDeep}>
                    Clear
                  </T>
                </Press>
              </Row>
              {done.map((item) => (
                <Row key={item.id} style={{ gap: 12, paddingVertical: 9 }}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      tap();
                      toggle(item.id);
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      backgroundColor: colors.sage,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="checkmark" size={13} color="#FFF" />
                  </Pressable>
                  <T
                    v="body"
                    style={{ flex: 1, textDecorationLine: 'line-through' }}
                  >
                    {item.name}
                  </T>
                  <Press onPress={() => setBought(item)}>
                    <T v="caption" color={colors.coralDeep}>
                      Put away
                    </T>
                  </Press>
                </Row>
              ))}
            </>
          ) : null}
        </Screen>
      </KeyboardAvoidingView>

      {bought ? (
        <QuantitySheet
          name={bought.name}
          initial={{ qty: bought.qty }}
          onCancel={() => setBought(null)}
          onConfirm={(b) => {
            addPantry({ name: b.name, qty: b.qty, unit: b.unit, place: b.place });
            remove(bought.id);
            setBought(null);
          }}
        />
      ) : null}
    </View>
  );
}
