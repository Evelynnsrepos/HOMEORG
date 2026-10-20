import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { colors, font, radius } from '../theme';
import { Row, tap } from './base';

/** The kitchen screens share one segmented header. */
const tabs = [
  { id: 'kitchen', label: 'Pantry', href: '/kitchen' },
  { id: 'cook', label: 'Cook', href: '/cook' },
  { id: 'recipes', label: 'Recipes', href: '/recipes' },
  { id: 'shopping', label: 'Shopping', href: '/shopping' },
] as const;

export type KitchenTab = (typeof tabs)[number]['id'];

export function KitchenTabs({ active }: { active: KitchenTab }) {
  const router = useRouter();
  return (
    <Row
      style={{
        backgroundColor: colors.cardAlt,
        borderRadius: radius.pill,
        padding: 3,
        gap: 2,
      }}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <Pressable
            key={t.id}
            onPress={() => {
              if (on) return;
              tap();
              router.replace(t.href);
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8,
              borderRadius: radius.pill,
              backgroundColor: on ? colors.card : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: on ? font.bold : font.medium,
                fontSize: 13,
                color: on ? colors.ink : colors.inkMuted,
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </Row>
  );
}
