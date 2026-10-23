import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

import { surfaceFor } from '../lib/surfaces';
import { careState, type CareState } from '../lib/pets';
import { type Reminder } from '../lib/remind';
import type { MyPet } from '../lib/types';
import { pieceById } from '../lib/stickers';
import { useStore } from '../state/store';
import { colors, font, radius } from '../theme';
import { Card, Press, Row, Spacer, T, tap, tapSuccess } from './base';
import { PieceImage } from './StickerLayer';

/** A tap within this many hours of the last one takes it back, for mis-taps. */
const UNDO_HOURS = 10 / 60;

/**
 * Your pet sitting on a strip of pixel floorboards, at whole-pixel scale so
 * it stays crisp: the same art as the stickers, at home on your Home screen.
 */
export function PetOnFloor({ look, width, height = 64 }: { look: string; width: number; height?: number }) {
  const p = pieceById(look);
  const floor = surfaceFor('floor', 'floor-boards-04');
  const k = 3; // points per art pixel
  const w = p?.type === 'pixel' ? p.piece.w * k : 48;
  const tiles = Math.ceil(width / (floor.w * k));
  return (
    <View style={{ width, height, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.cardAlt }}>
      {Array.from({ length: tiles }, (_, i) => (
        <Image
          key={i}
          source={floor.src}
          fadeDuration={0}
          resizeMode="stretch"
          style={{ position: 'absolute', left: i * floor.w * k, top: height - 18, width: floor.w * k, height: floor.h * k }}
        />
      ))}
      <View style={{ position: 'absolute', left: (width - w) / 2, bottom: 6 }}>
        <PieceImage piece={look} width={w} />
      </View>
    </View>
  );
}

/** The care buttons for one pet: a tap logs it, a second tap right after undoes it. */
export function CareButtons({ pet, columns = 2, size = 'small' }: { pet: MyPet; columns?: number; size?: 'small' | 'big' }) {
  const log = useStore((s) => s.petLog ?? []);
  const logCare = useStore((s) => s.logCare);
  const undoCare = useStore((s) => s.undoCare);
  // re-read the clock every minute so "due" warms up without a tap
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const states = careState(pet, log, now);

  const press = (st: CareState) => {
    if (st.since < UNDO_HOURS) {
      const last = [...log].reverse().find((c) => c.petId === pet.id && c.action === st.action.id);
      if (last) {
        tap();
        undoCare(last.id);
        setNow(new Date());
        return;
      }
    }
    tapSuccess();
    logCare(pet.id, st.action.id);
    setNow(new Date());
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {states.map((st) => {
        const fresh = st.since < st.action.every / 2;
        return (
          <Press
            key={st.action.id}
            onPress={() => press(st)}
            accessibilityLabel={`${st.action.label} for ${pet.name}`}
            accessibilityHint={st.since < UNDO_HOURS ? 'Tap again to undo' : undefined}
            style={{
              flexBasis: `${100 / columns - 4}%`,
              flexGrow: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingVertical: size === 'big' ? 10 : 6,
              paddingHorizontal: 8,
              borderRadius: radius.md,
              borderWidth: 1.5,
              // only something that was done and is now overdue warms up; "not yet" stays calm
              borderColor: st.due && isFinite(st.since) ? colors.needsLove : fresh ? colors.sage : colors.lineSoft,
              backgroundColor: fresh ? colors.sageSoft : colors.card,
            }}
          >
            <T style={{ fontSize: size === 'big' ? 18 : 14 }}>{st.action.emoji}</T>
            <View style={{ flex: 1 }}>
              <T v="caption" color={colors.ink} numberOfLines={1} style={{ fontFamily: font.semi, fontSize: size === 'big' ? 13 : 11 }}>
                {st.action.label}
              </T>
              {size === 'big' ? (
                <T v="caption" style={{ fontSize: 11 }}>
                  {st.since < UNDO_HOURS ? 'done · tap to undo' : agoText(st)}
                </T>
              ) : null}
            </View>
            {fresh ? <Ionicons name="checkmark" size={12} color={colors.sageDeep} /> : null}
          </Press>
        );
      })}
    </View>
  );
}

function agoText(st: CareState) {
  if (!isFinite(st.since)) return 'not yet today';
  const h = st.since;
  return h < 1 ? 'just now' : h < 24 ? `${Math.floor(h)}h ago` : `${Math.floor(h / 24)}d ago`;
}

/**
 * The Home tile for pet mode: your pet sitting there, and the day's care a tap
 * away. With several pets, tapping the pet shows the next one.
 */
export function PetWidget({ width }: { width: number }) {
  const router = useRouter();
  const pets = useStore((s) => s.pets ?? []);
  const [i, setI] = useState(0);
  const pet = pets[i % Math.max(1, pets.length)];
  return (
    <Card style={{ width, padding: 12 }}>
      <Press onPress={() => router.push('/pets')}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ gap: 6 }}>
            <Ionicons name="paw-outline" size={14} color={colors.coralDeep} />
            <T v="over" color={colors.coralDeep}>
              {pet ? pet.name : 'Pets'}
            </T>
          </Row>
          <Ionicons name="chevron-forward" size={13} color={colors.inkMuted} />
        </Row>
      </Press>
      <Spacer h={8} />
      {pet ? (
        <>
          <Press onPress={() => pets.length > 1 && (tap(), setI(i + 1))} accessibilityLabel={pets.length > 1 ? 'Next pet' : pet.name}>
            <PetOnFloor look={pet.look} width={width - 24} height={60} />
            {pets.length > 1 ? (
              <Row style={{ position: 'absolute', right: 6, top: 6, gap: 3 }}>
                {pets.map((p, j) => (
                  <View key={p.id} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: j === i % pets.length ? colors.coral : colors.lineSoft }} />
                ))}
              </Row>
            ) : null}
          </Press>
          <Spacer h={8} />
          <CareButtons pet={pet} columns={1} />
        </>
      ) : (
        <Press onPress={() => router.push('/pets')} style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
          <PetOnFloor look="pet-cat-ginger-tabby-sit" width={width - 24} height={60} />
          <T v="label" color={colors.coralDeep}>
            Add your pet
          </T>
        </Press>
      )}
    </Card>
  );
}

/** "Don't forget this": food to use or toss, a fridge to fill, pet supplies and jobs. */
export function DontForget({ items, width, max = 6 }: { items: Reminder[]; width?: number; max?: number }) {
  const router = useRouter();
  const compact = width != null;
  return (
    <Card style={{ padding: compact ? 12 : 14, width, borderColor: items.some((r) => r.tone === 'warm') ? colors.needsLove : colors.lineSoft }}>
      <Row style={{ gap: 6 }}>
        <Ionicons name="bookmark-outline" size={14} color={items.length ? colors.needsLove : colors.inkSoft} />
        <T v="over" color={items.length ? colors.needsLove : undefined} style={{ flexShrink: 1 }}>
          {"Don't forget this"}
        </T>
      </Row>
      {items.length ? (
        <>
          <Spacer h={6} />
          {items.slice(0, max).map((r, i) => (
            <Press
              key={r.id}
              onPress={() => router.push(r.route)}
              style={{
                flexDirection: 'row',
                alignItems: compact ? 'flex-start' : 'center',
                gap: 7,
                paddingVertical: compact ? 6 : 8,
                borderTopWidth: i ? 1 : 0,
                borderTopColor: colors.lineSoft,
              }}
            >
              <T style={{ fontSize: compact ? 13 : 15 }}>{r.emoji}</T>
              <View style={{ flex: 1, flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'flex-start' : 'center', gap: compact ? 0 : 8 }}>
                <T v="body" color={colors.ink} numberOfLines={compact ? 2 : 1} style={{ flex: compact ? undefined : 1, fontSize: compact ? 12.5 : undefined, lineHeight: compact ? 16 : undefined }}>
                  {r.text}
                </T>
                <T
                  v="caption"
                  color={r.tone === 'warm' ? colors.needsYou : colors.needsLove}
                  style={{ fontFamily: font.semi, fontSize: compact ? 10.5 : undefined }}
                >
                  {r.detail}
                </T>
              </View>
            </Press>
          ))}
          {items.length > max ? (
            <T v="caption" style={{ marginTop: 4 }}>
              and {items.length - max} more
            </T>
          ) : null}
        </>
      ) : (
        <T v="caption" style={{ marginTop: 4 }}>
          All good for now. Food close to its date, an empty fridge{compact ? ' and pet supplies' : ''} show up here.
        </T>
      )}
    </Card>
  );
}
