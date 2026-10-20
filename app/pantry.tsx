import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';

import { places, qtyLabel, unitStep, type Place } from '../src/data/units';
import { daysBetween, dayKey } from '../src/lib/date';
import type { PantryItem } from '../src/lib/types';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Btn, Card, Chip, Empty, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../src/ui/base';
import { KitchenTabs } from '../src/ui/KitchenTabs';
import { QuantitySheet } from '../src/ui/QuantitySheet';

export default function Pantry() {
  const router = useRouter();
  const pantry = useStore((s) => s.pantry);
  const addPantry = useStore((s) => s.addPantry);
  const adjustPantry = useStore((s) => s.adjustPantry);
  const updatePantry = useStore((s) => s.updatePantry);
  const removePantry = useStore((s) => s.removePantry);
  const addShopping = useStore((s) => s.addShopping);

  const [place, setPlace] = useState<Place>('fridge');
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [editing, setEditing] = useState<PantryItem | null>(null);
  const [menu, setMenu] = useState<PantryItem | null>(null);

  const shelves = useMemo(() => {
    const out: Record<Place, PantryItem[]> = { fridge: [], freezer: [], pantry: [] };
    for (const p of pantry) out[p.place]?.push(p);
    for (const k of Object.keys(out) as Place[]) {
      out[k].sort((a, b) => a.name.localeCompare(b.name));
    }
    return out;
  }, [pantry]);

  /** Anything gone off or going off inside three days, wherever it lives. */
  const soon = useMemo(() => {
    const today = dayKey();
    return pantry
      .filter((p) => p.bestBefore && daysBetween(today, p.bestBefore) <= 3)
      .sort((a, b) => (a.bestBefore ?? '').localeCompare(b.bestBefore ?? ''));
  }, [pantry]);

  const list = shelves[place];
  const meta = places.find((p) => p.id === place)!;

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
          <KitchenTabs active="pantry" />

          <Spacer h={16} />
          <T v="display" style={{ fontSize: 28 }}>
            What's actually{'\n'}in the house.
          </T>
          <Spacer h={6} />
          <T v="label">
            {pantry.length === 0
              ? 'Add things as you buy them, knock them down as you cook.'
              : `${pantry.length} ${pantry.length === 1 ? 'thing' : 'things'} on the shelves.`}
          </T>

          {/* Use me up ---------------------------------------------- */}
          {soon.length ? (
            <>
              <Spacer h={16} />
              <Card soft style={{ padding: 14, borderColor: colors.needsLove, borderWidth: 1.5 }}>
                <Row style={{ gap: 7 }}>
                  <Ionicons name="time-outline" size={15} color={colors.needsLove} />
                  <T v="over" color={colors.needsLove}>
                    Use these up
                  </T>
                </Row>
                <Spacer h={8} />
                {soon.map((p) => {
                  const left = daysBetween(dayKey(), p.bestBefore!);
                  return (
                    <Row key={p.id} style={{ paddingVertical: 4, justifyContent: 'space-between' }}>
                      <T v="body">{p.name}</T>
                      <T v="caption" color={left < 0 ? colors.needsYou : colors.needsLove}>
                        {left < 0
                          ? `${Math.abs(left)}d over`
                          : left === 0
                            ? 'today'
                            : `${left}d left`}
                      </T>
                    </Row>
                  );
                })}
              </Card>
            </>
          ) : null}

          {/* Shelf picker -------------------------------------------- */}
          <Spacer h={18} />
          <Row style={{ gap: 7 }}>
            {places.map((p) => (
              <Chip
                key={p.id}
                label={`${p.emoji}  ${p.name}`}
                active={place === p.id}
                onPress={() => setPlace(p.id)}
              />
            ))}
          </Row>
          <Spacer h={6} />
          <T v="caption">
            {meta.blurb} {shelves[place].length} in here.
          </T>

          {/* Add ----------------------------------------------------- */}
          <Spacer h={14} />
          <Row style={{ gap: 8 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Add something you bought"
              placeholderTextColor={colors.inkMuted}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (!draft.trim()) return;
                setAdding(draft.trim());
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
                setAdding(draft.trim());
              }}
            />
          </Row>

          <Spacer h={8} />
          <Btn
            tone="sage"
            icon="barcode-outline"
            label="Scan a barcode"
            onPress={() => router.push('/scan')}
          />

          {/* The shelf ----------------------------------------------- */}
          <Spacer h={14} />
          {list.length === 0 ? (
            <Empty
              emoji={meta.emoji}
              title={`The ${meta.name.toLowerCase()} is empty`}
              body="Tick things off the shopping list and they land here with the amount you bought."
            />
          ) : (
            list.map((item) => (
              <Card key={item.id} style={{ padding: 12, marginBottom: 8 }}>
                <Row style={{ gap: 10 }}>
                  <Press style={{ flex: 1 }} onPress={() => setEditing(item)}>
                    <T v="heading" style={{ fontSize: 14.5 }} numberOfLines={1}>
                      {item.name}
                    </T>
                    <T v="caption">
                      {qtyLabel(item.qty, item.unit)}
                      {item.bestBefore ? ` · best before ${item.bestBefore.slice(5)}` : ''}
                    </T>
                  </Press>

                  <Row style={{ gap: 4 }}>
                    <Round
                      icon="remove"
                      onPress={() => adjustPantry(item.id, -unitStep(item.unit))}
                    />
                    <Round
                      icon="add"
                      tint
                      onPress={() => adjustPantry(item.id, unitStep(item.unit))}
                    />
                  </Row>

                  <Press hitSlop={8} onPress={() => setMenu(item)}>
                    <Ionicons name="ellipsis-horizontal" size={16} color={colors.inkMuted} />
                  </Press>
                </Row>
              </Card>
            ))
          )}

          <Spacer h={16} />
          <T v="caption" center>
            The three dots move something to another shelf, or put it back on the list.{'\n'}
            Cook a recipe and its ingredients come off these shelves.
          </T>
        </Screen>
      </KeyboardAvoidingView>

      {adding ? (
        <QuantitySheet
          name={adding}
          initial={{ place }}
          onCancel={() => setAdding(null)}
          onConfirm={(b) => {
            addPantry({ name: b.name, qty: b.qty, unit: b.unit, place: b.place });
            setAdding(null);
            setDraft('');
            setPlace(b.place);
          }}
        />
      ) : null}

      {editing ? (
        <QuantitySheet
          name={editing.name}
          note="On the shelf"
          initial={{ qty: editing.qty, unit: editing.unit, place: editing.place }}
          confirmLabel="Save"
          onCancel={() => setEditing(null)}
          onConfirm={(b) => {
            updatePantry(editing.id, { name: b.name, qty: b.qty, unit: b.unit, place: b.place });
            setEditing(null);
            setPlace(b.place);
          }}
        />
      ) : null}

      {menu ? (
        <ItemMenu
          item={menu}
          onClose={() => setMenu(null)}
          onMove={(to) => {
            updatePantry(menu.id, { place: to });
            setPlace(to);
            setMenu(null);
          }}
          onEdit={() => {
            setEditing(menu);
            setMenu(null);
          }}
          onRanOut={() => {
            addShopping(menu.name, 1, 'ran out');
            removePantry(menu.id);
            setMenu(null);
          }}
          onRemove={() => {
            removePantry(menu.id);
            setMenu(null);
          }}
        />
      ) : null}
    </View>
  );
}

/**
 * What you can do with one thing on a shelf. Moving it somewhere else is the
 * first choice, because that is what happens to shopping when it thaws, gets
 * opened, or turns out not to fit in the fridge.
 */
function ItemMenu({
  item,
  onMove,
  onEdit,
  onRanOut,
  onRemove,
  onClose,
}: {
  item: PantryItem;
  onMove: (to: Place) => void;
  onEdit: () => void;
  onRanOut: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const here = places.find((p) => p.id === item.place);
  const elsewhere = places.filter((p) => p.id !== item.place);

  return (
    <Pressable
      onPress={onClose}
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
        <Card style={{ margin: 12, padding: 18 }}>
          <T v="over">In the {here?.name.toLowerCase() ?? 'kitchen'}</T>
          <Spacer h={4} />
          <T v="heading">{item.name}</T>
          <T v="caption">{qtyLabel(item.qty, item.unit)}</T>

          <Spacer h={16} />
          <T v="over">Move it to</T>
          <Spacer h={8} />
          <Row style={{ gap: 7 }}>
            {elsewhere.map((p) => (
              <Chip
                key={p.id}
                label={`${p.emoji}  ${p.name}`}
                onPress={() => {
                  tap();
                  onMove(p.id);
                }}
              />
            ))}
          </Row>

          <Spacer h={18} />
          <Btn tone="quiet" icon="create-outline" label="Change amount or name" onPress={onEdit} />
          <Spacer h={8} />
          <Btn
            tone="quiet"
            icon="cart-outline"
            label="Ran out — put it on the list"
            onPress={onRanOut}
          />
          <Spacer h={8} />
          <Btn tone="ghost" label="Take it off the shelf" onPress={onRemove} />
          <Spacer h={6} />
          <Btn tone="ghost" label="Close" onPress={onClose} />
        </Card>
      </Pressable>
    </Pressable>
  );
}

function Round({ icon, onPress, tint }: { icon: 'add' | 'remove'; onPress: () => void; tint?: boolean }) {
  return (
    <Pressable
      hitSlop={6}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: tint ? colors.sageSoft : colors.cardAlt,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={15} color={tint ? colors.sageDeep : colors.ink} />
    </Pressable>
  );
}
