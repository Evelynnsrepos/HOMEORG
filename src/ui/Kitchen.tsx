import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { fromDayKey, weekdayShort } from '../lib/date';
import { cookTimeLabel, effortLabel, nextDays } from '../lib/kitchen';
import type { Recipe, RecipeEffort } from '../lib/types';
import { colors, font, radius } from '../theme';
import { EffortRing } from './Art';
import { Btn, Card, Press, Row, Spacer, T, tap } from './base';

/** The rainbow ring from the sketch, sized to sit beside a line of text. */
export function EffortMeter({ effort, size = 7 }: { effort?: RecipeEffort; size?: number }) {
  if (!effort) return null;
  return (
    <View accessibilityLabel={effortLabel[effort]}>
      <EffortRing effort={effort} size={Math.round(size * 2.6)} />
    </View>
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

/** "Today", "Tomorrow", then "Thu 23". No day at all is "Soon". */
export function dayLabel(day?: string): string {
  if (!day) return 'Soon';
  const [today, tomorrow] = nextDays(2);
  if (day === today) return 'Today';
  if (day === tomorrow) return 'Tomorrow';
  const d = fromDayKey(day);
  return `${weekdayShort(d)} ${d.getDate()}`;
}

/**
 * How many of six columns a dish takes in the packed tile view: the longer it
 * takes, the more room it gets, the way the sketch has a tiny "1 min" square
 * next to a roomy "25 min" and the long cooks running the whole width.
 */
export function tileSpan(minutes?: number): number {
  if (!minutes) return 3;
  if (minutes <= 20) return 2;
  if (minutes <= 50) return 3;
  if (minutes <= 100) return 4;
  return 6;
}

/**
 * Rows of tiles that always come out full. Each row starts with the next dish
 * in order and fills the gap with the first later dishes that fit; whatever
 * room is left over goes to the last tile in the row.
 */
export function packRows<T>(items: T[], span: (t: T) => number, cols = 6): { item: T; span: number }[][] {
  const rest = items.map((item) => ({ item, span: Math.min(cols, span(item)) }));
  const rows: { item: T; span: number }[][] = [];
  while (rest.length) {
    const row = [rest.shift()!];
    let used = row[0].span;
    for (let i = 0; i < rest.length && used < cols; ) {
      if (used + rest[i].span <= cols) {
        used += rest[i].span;
        row.push(rest.splice(i, 1)[0]);
      } else i++;
    }
    row[row.length - 1].span += cols - used;
    rows.push(row);
  }
  return rows;
}

/** A dish in the packed view: name top left, ring top right, the time big bottom right. */
export function PickTile({
  recipe,
  width,
  day,
  note,
  onPress,
  onLongPress,
}: {
  recipe: Recipe;
  width: number;
  day?: string;
  note?: string;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const time = cookTimeLabel(recipe.minutes);
  const narrow = width < 150;
  return (
    <Press
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        width,
        height: 112,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.line,
        padding: 10,
        justifyContent: 'space-between',
      }}
    >
      <Row style={{ alignItems: 'flex-start', gap: 6 }}>
        <T v="heading" style={{ fontSize: 13.5, lineHeight: 17, flex: 1 }} numberOfLines={2}>
          {recipe.name}
        </T>
        {recipe.effort ? <EffortRing effort={recipe.effort} size={22} /> : null}
      </Row>
      <View style={{ flexDirection: narrow ? 'column' : 'row', alignItems: narrow ? 'stretch' : 'flex-end', justifyContent: 'space-between', gap: narrow ? 0 : 4 }}>
        <View style={{ flexShrink: 1 }}>
          {day ? (
            <T v="caption" color={colors.coralDeep} style={{ fontFamily: font.semi, fontSize: 10.5 }} numberOfLines={1}>
              {dayLabel(day)}
            </T>
          ) : null}
          {note ? (
            <T v="caption" style={{ fontSize: 10 }} numberOfLines={1}>
              {note}
            </T>
          ) : null}
        </View>
        {time ? (
          <T
            style={{ fontFamily: font.display, fontSize: narrow ? 19 : 24, lineHeight: narrow ? 22 : 28, color: colors.ink, textAlign: 'right' }}
            numberOfLines={1}
          >
            {time}
          </T>
        ) : null}
      </View>
    </Press>
  );
}

/** Pick a day for a dish: one of the next seven, or none at all. */
export function DaySheet({
  title,
  taken,
  current,
  allowNone = true,
  onPick,
  onClose,
}: {
  title: string;
  /** days the dish is already on */
  taken: (string | undefined)[];
  /** the day being changed, when moving a pick */
  current?: string;
  allowNone?: boolean;
  onPick: (day?: string) => void;
  onClose: () => void;
}) {
  const options: (string | undefined)[] = [...(allowNone ? [undefined] : []), ...nextDays(7)];
  return (
    <Pressable
      onPress={onClose}
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
          <T v="over">Cook it</T>
          <Spacer h={4} />
          <T v="heading">{title}</T>
          <Spacer h={14} />
          <Row style={{ flexWrap: 'wrap', gap: 7 }}>
            {options.map((d) => {
              const on = d !== current && taken.includes(d);
              const here = d === current && current !== undefined;
              return (
                <Pressable
                  key={d ?? 'none'}
                  disabled={on || here}
                  onPress={() => {
                    tap();
                    onPick(d);
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: radius.pill,
                    backgroundColor: on || here ? colors.sageSoft : colors.card,
                    borderWidth: 1,
                    borderColor: on || here ? colors.sageSoft : colors.line,
                    opacity: pressed ? 0.8 : 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  })}
                >
                  {on || here ? <Ionicons name="checkmark" size={12} color={colors.sageDeep} /> : null}
                  <T v="label" color={on || here ? colors.sageDeep : colors.ink}>
                    {d ? dayLabel(d) : 'No day, just soon'}
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
