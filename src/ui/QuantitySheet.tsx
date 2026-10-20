import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { formatQty, guessFor, places, units, unitStep, type Place } from '../data/units';
import { colors, font, radius } from '../theme';
import { Btn, Card, Chip, Row, Spacer, T, tap } from './base';

export interface Bought {
  name: string;
  qty: number;
  unit: string;
  place: Place;
}

/**
 * "How much did you buy?" — the sheet that turns a ticked-off shopping item
 * into something on a shelf. Opens pre-filled with a sensible guess so the
 * common case is one tap.
 */
export function QuantitySheet({
  name,
  note,
  initial,
  confirmLabel = 'Put it away',
  onCancel,
  onConfirm,
}: {
  name: string;
  /** a line under the title — where the name came from, say */
  note?: string;
  initial?: Partial<Bought>;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (b: Bought) => void;
}) {
  const guess = guessFor(name);
  const [label, setLabel] = useState(name);
  const [qty, setQty] = useState(initial?.qty ?? 1);
  const [unit, setUnit] = useState(initial?.unit ?? guess.unit);
  const [place, setPlace] = useState<Place>(initial?.place ?? guess.place);
  const [custom, setCustom] = useState('');
  const [customOpen, setCustomOpen] = useState(
    !!initial?.unit && !units.some((u) => u.id === initial.unit),
  );

  // switching to a coarser unit shouldn't leave you on 500 kg
  useEffect(() => {
    const step = unitStep(unit);
    if (step < 1 && qty > 50) setQty(1);
  }, [unit, qty]);

  const step = unitStep(unit);
  const activeUnit = customOpen ? custom.trim() || unit : unit;

  return (
    <Pressable
      onPress={onCancel}
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
          <T v="over">{note ?? 'Just bought'}</T>
          <Spacer h={5} />
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="What is it?"
            placeholderTextColor={colors.inkMuted}
            style={{
              fontFamily: font.bold,
              fontSize: 20,
              lineHeight: 25,
              color: colors.ink,
              paddingVertical: 2,
            }}
          />

          {/* how much ------------------------------------------------ */}
          <Spacer h={16} />
          <Row style={{ gap: 12 }}>
            <Stepper
              icon="remove"
              onPress={() => setQty((q) => Math.max(step, Math.round((q - step) * 100) / 100))}
            />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <TextInput
                value={formatQty(qty)}
                onChangeText={(v) => setQty(Math.max(0, parseFloat(v.replace(',', '.')) || 0))}
                keyboardType="decimal-pad"
                style={{
                  fontFamily: font.display,
                  fontSize: 30,
                  color: colors.ink,
                  textAlign: 'center',
                  minWidth: 90,
                  paddingVertical: 2,
                }}
              />
              <T v="caption">{activeUnit}</T>
            </View>
            <Stepper icon="add" onPress={() => setQty((q) => Math.round((q + step) * 100) / 100)} />
          </Row>

          {/* unit ---------------------------------------------------- */}
          <Spacer h={16} />
          <T v="over">Measured in</T>
          <Spacer h={8} />
          <Row style={{ flexWrap: 'wrap', gap: 6 }}>
            {units.map((u) => (
              <Chip
                key={u.id}
                small
                label={u.short}
                active={!customOpen && unit === u.id}
                onPress={() => {
                  setCustomOpen(false);
                  setUnit(u.id);
                }}
              />
            ))}
            <Chip small label="Own..." active={customOpen} onPress={() => setCustomOpen(true)} />
          </Row>
          {customOpen ? (
            <>
              <Spacer h={8} />
              <TextInput
                value={custom}
                onChangeText={setCustom}
                placeholder="slices, punnets, whatever"
                placeholderTextColor={colors.inkMuted}
                style={{
                  backgroundColor: colors.cardAlt,
                  borderRadius: radius.md,
                  paddingHorizontal: 13,
                  paddingVertical: 10,
                  fontFamily: font.medium,
                  fontSize: 14,
                  color: colors.ink,
                }}
              />
            </>
          ) : null}

          {/* where --------------------------------------------------- */}
          <Spacer h={16} />
          <T v="over">Goes in the</T>
          <Spacer h={8} />
          <Row style={{ gap: 7 }}>
            {places.map((p) => (
              <Chip
                key={p.id}
                small
                label={`${p.emoji}  ${p.name}`}
                active={place === p.id}
                onPress={() => setPlace(p.id)}
              />
            ))}
          </Row>

          <Spacer h={20} />
          <Row style={{ gap: 10 }}>
            <Btn label="Cancel" tone="quiet" full={false} onPress={onCancel} />
            <Btn
              style={{ flex: 1 }}
              label={confirmLabel}
              disabled={qty <= 0 || !label.trim()}
              onPress={() => onConfirm({ name: label.trim(), qty, unit: activeUnit, place })}
            />
          </Row>
        </Card>
      </Pressable>
    </Pressable>
  );
}

function Stepper({ icon, onPress }: { icon: 'add' | 'remove'; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.cardAlt,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={20} color={colors.ink} />
    </Pressable>
  );
}
