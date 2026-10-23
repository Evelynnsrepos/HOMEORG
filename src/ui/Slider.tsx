import React, { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { colors } from '../theme';
import { tap } from './base';

/**
 * A soft 0-100 slider: drag the thumb or tap anywhere on the track. It moves
 * in steps of five, because nobody's mood is 47.
 */
export function Slider({
  value,
  onChange,
  tint = colors.coral,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  tint?: string;
  label: string;
}) {
  const [width, setWidth] = useState(1);
  const THUMB = 26;
  const toValue = (x: number) => Math.max(0, Math.min(100, Math.round(((x - THUMB / 2) / (width - THUMB)) * 20) * 5));

  const set = (x: number) => {
    const v = toValue(x);
    if (v !== value) onChange(v);
  };
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .onUpdate((e) => set(e.x));
  const press = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      tap();
      set(e.x);
    });

  const left = (value / 100) * (width - THUMB);
  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, press)}>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          onChange(Math.max(0, Math.min(100, value + (e.nativeEvent.actionName === 'increment' ? 10 : -10))))
        }
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: 34, justifyContent: 'center' }}
      >
        <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.lineSoft }} />
        <View
          style={{ position: 'absolute', left: 0, width: left + THUMB / 2, height: 10, borderRadius: 5, backgroundColor: tint, opacity: 0.55 }}
        />
        <View
          style={{
            position: 'absolute',
            left,
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            backgroundColor: colors.card,
            borderWidth: 3,
            borderColor: tint,
          }}
        />
      </View>
    </GestureDetector>
  );
}
