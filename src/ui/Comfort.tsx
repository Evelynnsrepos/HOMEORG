import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { affirmationsFor, suggestionsFor, type Scales, type Suggestion } from '../lib/mood';
import type { MyPet, PetKind } from '../lib/types';
import { useStore } from '../state/store';
import { colors } from '../theme';
import { Btn, Card, Press, Row, Spacer, T, tap } from './base';
import { Sticker } from './Decor';
import { PieceImage } from './StickerLayer';

const CUDDLE: Record<PetKind, string> = {
  cat: 'Sit with them a while. A purring cat on your lap counts as rest.',
  dog: 'A head on your knee fixes more than it has any right to.',
  bird: 'Let them sit on your shoulder and chatter for a bit.',
  bunny: 'Sit on the floor with them. Slow strokes, slow breaths.',
  small: 'Let them potter about on your lap. Tiny feet, big calm.',
  fish: 'Sit by the bowl and watch them drift for a few minutes. That counts too.',
  reptile: 'A warm lizard on your hand and nowhere to be. Just be still together.',
  other: 'Spend a quiet moment together. They are glad you are here.',
};

const names = (pets: MyPet[]) =>
  pets.length === 1 ? pets[0].name : `${pets.slice(0, -1).map((p) => p.name).join(', ')} and ${pets.at(-1)!.name}`;

const SUGGEST: Record<Suggestion, { icon: keyof typeof Ionicons.glyphMap; label: string; hint: string }> = {
  rest: { icon: 'bed-outline', label: 'Take a few days off', hint: 'Vacation mode pauses every chore. Nothing piles up.' },
  tiny: { icon: 'leaf-outline', label: 'Just one tiny thing', hint: 'Focus with low energy picks one easy task. Or none.' },
  quiet: { icon: 'moon-outline', label: 'A quiet day is allowed', hint: 'Cancel what you can. You owe nobody your energy today.' },
  cosy: { icon: 'musical-notes-outline', label: 'Something cosy', hint: 'Put on some music, get a blanket, drink some water.' },
};

/** The answer to a hard day: kind words and ways to do less. */
export function Comfort({ v, onClose }: { v: Scales; onClose: () => void }) {
  const router = useRouter();
  const vacation = useStore((s) => s.settings.vacation);
  const toggleVacation = useStore((s) => s.toggleVacation);
  const lines = affirmationsFor(v);
  // in pet mode, the first thing on a hard day is the softest one
  const petMode = useStore((s) => !!s.settings.petMode);
  const pets = useStore((s) => s.pets ?? []);
  const logCare = useStore((s) => s.logCare);
  const [cuddled, setCuddled] = useState(false);
  const cuddle = petMode && pets.length ? pets.slice(0, 3) : [];
  const act = (s: Suggestion) => {
    tap();
    if (s === 'rest' && !vacation) toggleVacation();
    if (s === 'tiny') router.push('/focus');
    if (s === 'cosy') router.push('/music');
  };
  return (
    <Pressable
      onPress={onClose}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#3D2836CC', justifyContent: 'center', padding: 16 }}
    >
      <Pressable onPress={() => {}}>
        <Card style={{ padding: 20 }}>
          <Sticker kind="heart" size={52} tilt={-10} style={{ position: 'absolute', right: -8, top: -18 }} />
          <T v="title">Thank you for telling me.</T>
          <Spacer h={12} />
          {lines.map((l) => (
            <Row key={l} style={{ alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <T style={{ fontSize: 16 }}>💗</T>
              <T v="body" color={colors.ink} style={{ flex: 1, fontSize: 15, lineHeight: 21 }}>
                {l}
              </T>
            </Row>
          ))}
          <Spacer h={4} />
          <T v="over">If it helps</T>
          <Spacer h={6} />
          {cuddle.length ? (
            <Press
              onPress={() => {
                tap();
                if (!cuddled) cuddle.forEach((p) => logCare(p.id, 'cuddle'));
                setCuddled(true);
              }}
              style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.lineSoft }}
            >
              <View style={{ width: 28, alignItems: 'center' }}>
                <PieceImage piece={cuddle[0].look} width={26} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="label" color={colors.ink}>
                  {cuddled ? 'Enjoy your cuddle 💗' : `Cuddle session with ${names(cuddle)}`}
                </T>
                <T v="caption">{CUDDLE[cuddle[0].kind]}</T>
              </View>
            </Press>
          ) : null}
          {suggestionsFor(v).map((s) => (
            <Press
              key={s}
              onPress={() => act(s)}
              style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.lineSoft }}
            >
              <Ionicons name={SUGGEST[s].icon} size={18} color={colors.coralDeep} />
              <View style={{ flex: 1 }}>
                <T v="label" color={colors.ink}>
                  {s === 'rest' && vacation ? 'Vacation mode is on' : SUGGEST[s].label}
                </T>
                <T v="caption">{SUGGEST[s].hint}</T>
              </View>
            </Press>
          ))}
          <Spacer h={10} />
          <T v="caption">
            If it's more than a hard day, you don't have to carry it alone. Talk to someone you trust. In
            Germany the TelefonSeelsorge listens for free, day and night:{' '}
            <T v="caption" color={colors.coralDeep} onPress={() => Linking.openURL('tel:08001110111')}>
              0800 111 0 111
            </T>
            .
          </T>
          <Spacer h={14} />
          <Btn label="Okay" onPress={onClose} />
        </Card>
      </Pressable>
    </Pressable>
  );
}
