import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '../state/store';
import { colors, font, radius, shadow } from '../theme';
import { T } from './base';

/**
 * "+15 · Home cooked" sliding down from the top whenever coins come in, from
 * wherever they come. Small and quick, so it cheers without getting in the way.
 */
export function CoinToast() {
  const insets = useSafeAreaInsets();
  const reward = useStore((s) => s.lastReward);
  const [shown, setShown] = useState(reward);
  const y = useRef(new Animated.Value(-80)).current;
  const first = useRef(true);

  useEffect(() => {
    // the reward that was there when the app opened isn't news
    if (first.current) {
      first.current = false;
      return;
    }
    if (!reward) return;
    setShown(reward);
    y.setValue(-80);
    Animated.sequence([
      Animated.spring(y, { toValue: 0, friction: 6, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(y, { toValue: -80, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [reward, y]);

  if (!shown) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 6, left: 0, right: 0, alignItems: 'center' }}>
      <Animated.View
        style={{
          transform: [{ translateY: y }],
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.card,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.goldSoft,
          paddingHorizontal: 14,
          paddingVertical: 7,
          ...shadow.lift,
        }}
      >
        <Ionicons name="ellipse" size={12} color={colors.gold} />
        <T style={{ fontFamily: font.bold, fontSize: 14, color: colors.goldDeep }}>+{shown.coins}</T>
        <T v="caption" color={colors.inkSoft}>
          {shown.label}
        </T>
      </Animated.View>
    </View>
  );
}
