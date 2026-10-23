import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { addDays, dayKey, daysBetween } from '../lib/date';
import { autoBestBefore, shelfLifeText } from '../data/shelfLife';
import { formatQty, guessFor, places, units, unitStep, type Place } from '../data/units';
import { ocrAvailable } from '../lib/ocr';
import { colors, font, radius } from '../theme';
import { Btn, Card, Chip, Row, Spacer, T, tap } from './base';
import { DateScanner } from './DateScanner';

export interface Bought {
  name: string;
  qty: number;
  unit: string;
  place: Place;
  /** day key from the packet; undefined looks it up from the shelf, null means it keeps */
  bestBefore?: string | null;
}

/** "Good for" shortcuts, in days from today. */
const KEEPS = [
  { label: '2 days', days: 2 },
  { label: '4 days', days: 4 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
];

/**
 * "How much did you buy?" — the sheet that turns a ticked-off shopping item
 * into something on a shelf. Opens pre-filled with a sensible guess so the
 * common case is one tap.
 */
export function QuantitySheet({
  name,
  note,
  initial,
  hints,
  dateNote,
  onScanningChange,
  confirmLabel = 'Put it away',
  onCancel,
  onConfirm,
}: {
  /** other words for it, from a barcode lookup, for the "Auto" estimate */
  hints?: string[];
  /** where a date filled in up front came from, e.g. "from the QR code" */
  dateNote?: string;
  /** told when the date camera opens and closes, so a camera behind can pause */
  onScanningChange?: (on: boolean) => void;
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
  const [bestBefore, setBestBefore] = useState<string | null | undefined>(initial?.bestBefore);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<string | null>(null);
  const scanDate = (on: boolean) => {
    setScanning(on);
    onScanningChange?.(on);
  };
  // what "Auto" would give for this name on this shelf, shown so it's not a black box
  const auto = autoBestBefore(label || name, place, new Date(), hints);
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
        backgroundColor: '#3D2836B8',
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

          {/* good till ------------------------------------------------ */}
          <Spacer h={16} />
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="over">Good for</T>
            {(bestBefore === undefined ? auto : bestBefore) ? (
              <T v="caption">
                {bestBefore === undefined ? '≈ ' : ''}till {dateText((bestBefore ?? auto)!)}
                {dateNote && bestBefore && bestBefore === initial?.bestBefore ? ` · ${dateNote}` : ''}
                {scanned && bestBefore === scanned ? ' · read off the label' : ''}
              </T>
            ) : null}
          </Row>
          <Spacer h={8} />
          <Row style={{ flexWrap: 'wrap', gap: 6 }}>
            <Chip
              small
              icon="sparkles"
              label={`Auto · ${shelfLifeText(label || name, place, hints)}`}
              active={bestBefore === undefined}
              onPress={() => setBestBefore(undefined)}
            />
            {ocrAvailable() ? (
              <Chip small icon="camera-outline" label="Scan date" active={!!scanned && bestBefore === scanned} onPress={() => scanDate(true)} />
            ) : null}
            <Chip small label="Keeps" active={bestBefore === null} onPress={() => setBestBefore(null)} />
            {KEEPS.map((k) => {
              const day = dayKey(addDays(new Date(), k.days));
              return (
                <Chip
                  key={k.days}
                  small
                  label={k.label}
                  active={bestBefore === day}
                  onPress={() => setBestBefore(day)}
                />
              );
            })}
          </Row>

          <Spacer h={20} />
          <Row style={{ gap: 10 }}>
            <Btn label="Cancel" tone="quiet" full={false} onPress={onCancel} />
            <Btn
              style={{ flex: 1 }}
              label={confirmLabel}
              disabled={qty <= 0 || !label.trim()}
              onPress={() => onConfirm({ name: label.trim(), qty, unit: activeUnit, place, bestBefore })}
            />
          </Row>
        </Card>
      </Pressable>
      {scanning ? (
        <DateScanner
          onClose={() => scanDate(false)}
          onFound={(day) => {
            setBestBefore(day);
            setScanned(day);
            scanDate(false);
          }}
        />
      ) : null}
    </Pressable>
  );
}

function dateText(day: string): string {
  return `${day.slice(8)}.${day.slice(5, 7)}. (${daysBetween(dayKey(), day)}d)`;
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
