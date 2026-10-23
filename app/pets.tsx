import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, TextInput, View, useWindowDimensions } from 'react-native';

import { amountNow, daysLeft, kindOfPreset, PET_KINDS, presetsFor, SUPPLY_LOW_DAYS } from '../src/lib/pets';
import { pieceById } from '../src/lib/stickers';
import type { PetKind, PetSupply, SupplyKind } from '../src/lib/types';
import { useStore } from '../src/state/store';
import { colors, font, radius } from '../src/theme';
import { Bar, Btn, Card, Chip, Empty, IconBtn, Press, Row, Screen, Spacer, T, tap } from '../src/ui/base';
import { Splashes } from '../src/ui/PixelSplash';
import { CareButtons, PetOnFloor } from '../src/ui/Pets';
import { PieceImage } from '../src/ui/StickerLayer';

const SUPPLY_KINDS: { id: SupplyKind; label: string; emoji: string }[] = [
  { id: 'food', label: 'Food', emoji: '🥫' },
  { id: 'treats', label: 'Treats', emoji: '🦴' },
  { id: 'litter', label: 'Litter', emoji: '🪣' },
  { id: 'hay', label: 'Hay', emoji: '🌿' },
  { id: 'bedding', label: 'Bedding', emoji: '🛏️' },
  { id: 'meds', label: 'Meds', emoji: '💊' },
  { id: 'other', label: 'Other', emoji: '🛍️' },
];
const UNITS = ['g', 'kg', 'cans', 'pouches', 'bags', 'l', 'pcs'];

/** Quick starts for the supply form, by the kinds of pets you have. */
const SUPPLY_PRESETS: Record<PetKind, Omit<PetSupply, 'id' | 'updatedAt'>[]> = {
  cat: [
    { name: 'Cat food', kind: 'food', amount: 24, full: 24, unit: 'pouches', perDay: 2 },
    { name: 'Cat litter', kind: 'litter', amount: 10, full: 10, unit: 'kg', perDay: 0.3 },
    { name: 'Cat treats', kind: 'treats', amount: 60, full: 60, unit: 'g', perDay: 3 },
  ],
  dog: [
    { name: 'Dog food', kind: 'food', amount: 12, full: 12, unit: 'kg', perDay: 0.3 },
    { name: 'Dog treats', kind: 'treats', amount: 500, full: 500, unit: 'g', perDay: 15 },
    { name: 'Poo bags', kind: 'other', amount: 120, full: 120, unit: 'pcs', perDay: 3 },
  ],
  bird: [
    { name: 'Bird seed', kind: 'food', amount: 1000, full: 1000, unit: 'g', perDay: 20 },
    { name: 'Cage sand', kind: 'bedding', amount: 5, full: 5, unit: 'kg', perDay: 0.1 },
  ],
  bunny: [
    { name: 'Hay', kind: 'hay', amount: 3, full: 3, unit: 'kg', perDay: 0.15 },
    { name: 'Bunny pellets', kind: 'food', amount: 1500, full: 1500, unit: 'g', perDay: 40 },
    { name: 'Bedding', kind: 'bedding', amount: 30, full: 30, unit: 'l', perDay: 1.5 },
  ],
  other: [{ name: 'Food', kind: 'food', amount: 1, full: 1, unit: 'bags', perDay: 0 }],
};

type PetDraft = { id?: string; name: string; kind: PetKind; look: string };
type SupplyDraft = { id?: string; name: string; kind: SupplyKind; amount: string; full: string; unit: string; perDay: string };

/**
 * Pet mode's own screen: your pets and a tap for every bit of care, and the
 * supplies they go through, with a guess at when each runs out. Low supplies
 * and due cleaning jobs show up in "Don't forget this" on Home.
 */
export default function Pets() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const inner = Math.min(W, 520) - 32;
  const petMode = useStore((s) => !!s.settings.petMode);
  const patchSettings = useStore((s) => s.patchSettings);
  const pets = useStore((s) => s.pets ?? []);
  const supplies = useStore((s) => s.petSupplies ?? []);
  const addPet = useStore((s) => s.addPet);
  const updatePet = useStore((s) => s.updatePet);
  const removePet = useStore((s) => s.removePet);
  const addSupply = useStore((s) => s.addSupply);
  const updateSupply = useStore((s) => s.updateSupply);
  const restockSupply = useStore((s) => s.restockSupply);
  const removeSupply = useStore((s) => s.removeSupply);

  const [pet, setPet] = useState<PetDraft | null>(null);
  const [supply, setSupply] = useState<SupplyDraft | null>(null);

  const savePet = () => {
    if (!pet || !pet.name.trim()) return;
    const data = { name: pet.name.trim(), kind: pet.kind, look: pet.look };
    if (pet.id) updatePet(pet.id, data);
    else addPet(data);
    setPet(null);
  };
  const saveSupply = () => {
    if (!supply || !supply.name.trim()) return;
    const num = (v: string) => Math.max(0, Number(v.replace(',', '.')) || 0);
    const data = {
      name: supply.name.trim(),
      kind: supply.kind,
      amount: num(supply.amount),
      full: num(supply.full) || num(supply.amount),
      unit: supply.unit,
      perDay: num(supply.perDay),
    };
    if (supply.id) updateSupply(supply.id, data);
    else addSupply(data);
    setSupply(null);
  };
  const kinds = [...new Set(pets.map((p) => p.kind))];

  return (
    <Screen keyboardShouldPersistTaps="handled">
      <Splashes width={Math.min(W, 520)} spots={[{ x: 0.88, y: 120, size: 150, tone: 'gold' }, { x: 0.06, y: 520, size: 140, tone: 'lilac' }]} />
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name="chevron-back" onPress={() => router.back()} />
        <T v="heading">Your pets</T>
        <View style={{ width: 38 }} />
      </Row>
      <Spacer h={6} />
      <T v="display" style={{ fontSize: 28 }}>
        The ones who live here too
      </T>
      <T v="label">Tap what you did for them. Tap again right after to take it back.</T>

      {!petMode ? (
        <>
          <Spacer h={14} />
          <Card style={{ padding: 14, borderColor: colors.coral }}>
            <T v="label" color={colors.ink}>
              Pet mode is off
            </T>
            <T v="caption" style={{ marginTop: 2 }}>
              Turn it on for a pet tile on Home, and pet food and litter in "Don't forget this".
            </T>
            <Spacer h={10} />
            <Btn small icon="paw" label="Turn on pet mode" onPress={() => patchSettings({ petMode: true })} />
          </Card>
        </>
      ) : null}

      {/* pets ------------------------------------------------------------ */}
      <Spacer h={16} />
      {pets.map((p) => (
        <Card key={p.id} style={{ padding: 14, marginBottom: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <T v="heading">{p.name}</T>
              <T v="caption">{PET_KINDS.find((k) => k.id === p.kind)?.label}</T>
            </View>
            <IconBtn name="create-outline" onPress={() => setPet({ ...p })} />
          </Row>
          <Spacer h={8} />
          <PetOnFloor look={p.look} width={inner - 28} height={84} />
          <Spacer h={10} />
          <CareButtons pet={p} size="big" />
        </Card>
      ))}
      {!pets.length && !pet ? <Empty emoji="🐾" title="No pets yet" body="Add the ones you live with, pick how they look, and their care is one tap away." /> : null}

      {pet ? (
        <PetEditor
          draft={pet}
          width={inner}
          onChange={setPet}
          onSave={savePet}
          onCancel={() => setPet(null)}
          onRemove={pet.id ? () => (removePet(pet.id!), setPet(null)) : undefined}
        />
      ) : (
        <Btn
          tone="quiet"
          icon="add"
          label="Add a pet"
          onPress={() => setPet({ name: '', kind: 'cat', look: presetsFor('cat')[0] })}
        />
      )}

      {/* supplies -------------------------------------------------------- */}
      <Spacer h={22} />
      <T v="over">Supplies</T>
      <Spacer h={8} />
      {supplies.length ? (
        <Card style={{ padding: 6 }}>
          {supplies.map((s, i) => {
            const d = daysLeft(s);
            const low = d != null && d <= SUPPLY_LOW_DAYS;
            const span = s.perDay ? s.full / s.perDay : 1;
            return (
              <View key={s.id} style={{ padding: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.lineSoft }}>
                <Row style={{ gap: 10 }}>
                  <T style={{ fontSize: 20 }}>{SUPPLY_KINDS.find((k) => k.id === s.kind)?.emoji}</T>
                  <Press style={{ flex: 1 }} onPress={() => setSupply(toDraft(s))}>
                    <T v="label" color={colors.ink}>
                      {s.name}
                    </T>
                    <T v="caption" color={low ? colors.needsYou : undefined}>
                      {fmt(amountNow(s))} {s.unit} left
                      {d != null ? ` · ${d < 1 ? 'about out' : `~${Math.round(d)} days`}` : ''}
                    </T>
                  </Press>
                  <Btn small full={false} tone={low ? 'primary' : 'ghost'} label="Restocked" onPress={() => (tap(), restockSupply(s.id))} />
                </Row>
                {d != null ? (
                  <View style={{ marginTop: 8, marginLeft: 30 }}>
                    <Bar pct={Math.min(100, (d / span) * 100)} color={low ? colors.needsLove : colors.sage} height={4} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </Card>
      ) : (
        <T v="caption">Track food, litter or hay and you'll get a nudge a few days before it runs out.</T>
      )}
      <Spacer h={10} />
      {supply ? (
        <SupplyEditor
          draft={supply}
          onChange={setSupply}
          onSave={saveSupply}
          onCancel={() => setSupply(null)}
          onRemove={supply.id ? () => (removeSupply(supply.id!), setSupply(null)) : undefined}
        />
      ) : (
        <>
          {kinds.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
              {kinds
                .flatMap((k) => SUPPLY_PRESETS[k])
                .filter((x) => !supplies.some((s) => s.name === x.name))
                .map((x) => (
                  <Chip key={x.name} small icon="add" label={x.name} onPress={() => setSupply(toDraft(x))} />
                ))}
            </ScrollView>
          ) : null}
          <Btn
            tone="quiet"
            icon="add"
            label="Add a supply"
            onPress={() => setSupply({ name: '', kind: 'food', amount: '', full: '', unit: 'g', perDay: '' })}
          />
        </>
      )}
    </Screen>
  );
}

const fmt = (n: number) => (n >= 10 ? Math.round(n).toString() : (Math.round(n * 10) / 10).toString());

function toDraft(s: Omit<PetSupply, 'id' | 'updatedAt'> & { id?: string; updatedAt?: string }): SupplyDraft {
  const now = s.updatedAt ? amountNow(s as PetSupply) : s.amount;
  return { id: s.id, name: s.name, kind: s.kind, amount: fmt(now), full: String(s.full), unit: s.unit, perDay: s.perDay ? String(s.perDay) : '' };
}

function Field({ value, onChange, placeholder, numeric, style }: { value: string; onChange: (v: string) => void; placeholder: string; numeric?: boolean; style?: object }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.inkMuted}
      keyboardType={numeric ? 'decimal-pad' : 'default'}
      style={[
        {
          backgroundColor: colors.cardAlt,
          borderRadius: radius.md,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontFamily: font.body,
          fontSize: 15,
          color: colors.ink,
        },
        style,
      ]}
    />
  );
}

/** Name, kind and look; every pixel pet preset is free for your own pet. */
function PetEditor({
  draft,
  width,
  onChange,
  onSave,
  onCancel,
  onRemove,
}: {
  draft: PetDraft;
  width: number;
  onChange: (d: PetDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const looks = presetsFor(draft.kind);
  const tile = Math.floor((width - 28 - 4 * 6) / 5);
  return (
    <Card style={{ padding: 14, borderColor: colors.coral }}>
      <T v="over">{draft.id ? 'Edit pet' : 'New pet'}</T>
      <Spacer h={8} />
      <Field value={draft.name} onChange={(name) => onChange({ ...draft, name })} placeholder="Their name" />
      <Spacer h={10} />
      <Row style={{ flexWrap: 'wrap', gap: 6 }}>
        {PET_KINDS.map((k) => (
          <Chip
            key={k.id}
            small
            label={`${k.emoji} ${k.label}`}
            active={draft.kind === k.id}
            onPress={() => onChange({ ...draft, kind: k.id, look: kindOfPreset(draft.look) === k.id || k.id === 'other' ? draft.look : presetsFor(k.id)[0] })}
          />
        ))}
      </Row>
      <Spacer h={10} />
      <T v="label">Looks like</T>
      <Spacer h={6} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {looks.map((id) => {
          const p = pieceById(id);
          const ratio = p?.type === 'pixel' ? p.piece.w / p.piece.h : 1;
          const box = tile - 10;
          return (
            <Press
              key={id}
              onPress={() => (tap(), onChange({ ...draft, look: id }))}
              accessibilityLabel={p?.type === 'pixel' ? p.piece.label : id}
              style={{
                width: tile,
                height: tile,
                borderRadius: radius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: draft.look === id ? colors.coralSoft : colors.cardAlt,
                borderWidth: draft.look === id ? 2 : 0,
                borderColor: colors.coral,
              }}
            >
              <PieceImage piece={id} width={ratio > 1 ? box : box * ratio} />
            </Press>
          );
        })}
      </View>
      <Spacer h={12} />
      <Row style={{ gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Btn small tone="ghost" label="Cancel" onPress={onCancel} />
        </View>
        <View style={{ flex: 2 }}>
          <Btn small icon="heart" label={draft.id ? 'Save' : 'Add to the family'} onPress={onSave} />
        </View>
      </Row>
      {onRemove ? (
        <Press onPress={onRemove} style={{ alignSelf: 'center', marginTop: 10, flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Ionicons name="trash-outline" size={13} color={colors.inkMuted} />
          <T v="caption">Remove</T>
        </Press>
      ) : null}
    </Card>
  );
}

function SupplyEditor({
  draft,
  onChange,
  onSave,
  onCancel,
  onRemove,
}: {
  draft: SupplyDraft;
  onChange: (d: SupplyDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  return (
    <Card style={{ padding: 14, borderColor: colors.coral }}>
      <T v="over">{draft.id ? 'Edit supply' : 'New supply'}</T>
      <Spacer h={8} />
      <Field value={draft.name} onChange={(name) => onChange({ ...draft, name })} placeholder="What is it? (cat food, hay…)" />
      <Spacer h={10} />
      <Row style={{ flexWrap: 'wrap', gap: 6 }}>
        {SUPPLY_KINDS.map((k) => (
          <Chip key={k.id} small label={`${k.emoji} ${k.label}`} active={draft.kind === k.id} onPress={() => onChange({ ...draft, kind: k.id })} />
        ))}
      </Row>
      <Spacer h={10} />
      <Row style={{ gap: 8 }}>
        <View style={{ flex: 1 }}>
          <T v="caption">Have now</T>
          <Field numeric value={draft.amount} onChange={(amount) => onChange({ ...draft, amount })} placeholder="0" />
        </View>
        <View style={{ flex: 1 }}>
          <T v="caption">A full pack</T>
          <Field numeric value={draft.full} onChange={(full) => onChange({ ...draft, full })} placeholder="same" />
        </View>
        <View style={{ flex: 1 }}>
          <T v="caption">Used a day</T>
          <Field numeric value={draft.perDay} onChange={(perDay) => onChange({ ...draft, perDay })} placeholder="optional" />
        </View>
      </Row>
      <Spacer h={8} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {UNITS.map((u) => (
          <Chip key={u} small label={u} active={draft.unit === u} onPress={() => onChange({ ...draft, unit: u })} />
        ))}
      </ScrollView>
      <Spacer h={12} />
      <Row style={{ gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Btn small tone="ghost" label="Cancel" onPress={onCancel} />
        </View>
        <View style={{ flex: 2 }}>
          <Btn small icon="checkmark" label="Save" onPress={onSave} />
        </View>
      </Row>
      {onRemove ? (
        <Press onPress={onRemove} style={{ alignSelf: 'center', marginTop: 10, flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Ionicons name="trash-outline" size={13} color={colors.inkMuted} />
          <T v="caption">Remove</T>
        </Press>
      ) : null}
    </Card>
  );
}

