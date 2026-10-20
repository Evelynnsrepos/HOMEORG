import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { fromDayKey, weekdayShort } from '../lib/date';
import { cookTimeLabel, effortLabel, nextDays } from '../lib/kitchen';
import type { Recipe, RecipeEffort } from '../lib/types';
import { colors, radius } from '../theme';
import { Btn, Card, Press, Row, Spacer, T, tap } from './base';

/** Three dots, as many filled as the dish is work. */
export function EffortMeter({ effort, size = 7 }: { effort?: RecipeEffort; size?: number }) {
  if (!effort) return null;
  return (
    <Row style={{ gap: 2.5 }} accessibilityLabel={effortLabel[effort]}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: i <= effort ? colors.coralDeep : colors.line,
          }}
        />
      ))}
    </Row>
  );
}

export function CookTime({ minutes }: { minutes?: number }) {
  const label = cookTimeLabel(minutes);
  if (!label) return null;
  return (
    <Row style={{ gap: 3 }}>
      <Ionicons name="time-outline" size={11} color={colors.inkMuted} />
      <T v="caption" style={{ fontSize: 11 }}>
        {label}
      </T>
    </Row>
  );
}

/** "Today", "Tomorrow", then "Thu 23". */
export function dayLabel(day: string): string {
  const [today, tomorrow] = nextDays(2);
  if (day === today) return 'Today';
  if (day === tomorrow) return 'Tomorrow';
  const d = fromDayKey(day);
  return `${weekdayShort(d)} ${d.getDate()}`;
}

/** A square for the tile view of "Let's cook it". */
export function RecipeTile({
  recipe,
  width,
  note,
  noteColor,
  onPress,
}: {
  recipe: Recipe;
  width: number;
  note?: string;
  noteColor?: string;
  onPress: () => void;
}) {
  return (
    <Press
      onPress={onPress}
      style={{
        width,
        minHeight: width * 0.85,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.lineSoft,
        padding: 11,
        justifyContent: 'space-between',
      }}
    >
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <EffortMeter effort={recipe.effort} size={6} />
        <View style={{ flex: 1 }} />
        <CookTime minutes={recipe.minutes} />
      </Row>
      <View>
        <Row style={{ gap: 4 }}>
          {recipe.wanted ? <Ionicons name="star" size={11} color={colors.gold} /> : null}
          <T v="heading" style={{ fontSize: 14, flex: 1 }} numberOfLines={2}>
            {recipe.name}
          </T>
        </Row>
        {note ? (
          <T v="caption" color={noteColor} numberOfLines={1} style={{ marginTop: 2 }}>
            {note}
          </T>
        ) : null}
      </View>
    </Press>
  );
}

/** Pick one of the next seven days for a dish. */
export function DaySheet({
  title,
  taken,
  onPick,
  onClose,
}: {
  title: string;
  /** days the dish is already on */
  taken: string[];
  onPick: (day: string) => void;
  onClose: () => void;
}) {
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
          <T v="over">Cook it on</T>
          <Spacer h={4} />
          <T v="heading">{title}</T>
          <Spacer h={14} />
          <Row style={{ flexWrap: 'wrap', gap: 7 }}>
            {nextDays(7).map((d) => {
              const on = taken.includes(d);
              return (
                <Pressable
                  key={d}
                  disabled={on}
                  onPress={() => {
                    tap();
                    onPick(d);
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: radius.pill,
                    backgroundColor: on ? colors.sageSoft : colors.card,
                    borderWidth: 1,
                    borderColor: on ? colors.sageSoft : colors.line,
                    opacity: pressed ? 0.8 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  })}
                >
                  {on ? <Ionicons name="checkmark" size={12} color={colors.sageDeep} /> : null}
                  <T v="label" color={on ? colors.sageDeep : colors.ink}>
                    {dayLabel(d)}
                  </T>
                </Pressable>
              );
            })}
          </Row>
          <Spacer h={16} />
          <Btn tone="ghost" label="Close" onPress={onClose} />
        </Card>
      </Pressable>
    </Pressable>
  );
}
