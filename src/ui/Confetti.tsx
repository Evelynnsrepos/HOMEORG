import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

import { colors } from '../theme';

const PIECES = 18;
const PALETTE = [colors.coral, colors.sage, colors.gold, '#A78BC4', '#7FA8C4', '#E2856A'];

/**
 * A small burst for the moment something gets ticked off. Purely decorative —
 * it never blocks a tap and cleans itself up.
 */
export function Confetti({
  trigger,
  origin = 0.5,
  spread = 160,
}: {
  /** bump this number to fire another burst */
  trigger: number;
  /** horizontal start point, 0..1 of the container */
  origin?: number;
  spread?: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => {
        const angle = (i / PIECES) * Math.PI * 2 + (trigger % 7) * 0.3;
        return {
          key: `${trigger}-${i}`,
          dx: Math.cos(angle) * spread * (0.35 + ((i * 37) % 65) / 100),
          dy: Math.sin(angle) * spread * (0.3 + ((i * 53) % 55) / 100) - 40,
          color: PALETTE[i % PALETTE.length],
          size: 5 + ((i * 13) % 5),
          round: i % 3 === 0,
          spin: i % 2 ? 1 : -1,
        };
      }),
    [trigger, spread],
  );

  useEffect(() => {
    if (!trigger) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [trigger, progress]);

  if (!trigger) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' }}
    >
      {pieces.map((p) => (
        <Animated.View
          key={p.key}
          style={{
            position: 'absolute',
            left: `${origin * 100}%`,
            top: '50%',
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            borderRadius: p.round ? p.size : 2,
            backgroundColor: p.color,
            opacity: progress.interpolate({
              inputRange: [0, 0.65, 1],
              outputRange: [1, 0.9, 0],
            }),
            transform: [
              {
                translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }),
              },
              {
                translateY: progress.interpolate({
                  inputRange: [0, 0.55, 1],
                  outputRange: [0, p.dy, p.dy + 70],
                }),
              },
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${p.spin * 320}deg`],
                }),
              },
              {
                scale: progress.interpolate({
                  inputRange: [0, 0.15, 1],
                  outputRange: [0.4, 1, 0.85],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
