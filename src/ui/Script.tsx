import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { colors, font } from '../theme';

/**
 * The handwritten titles from the sketches: a curvy calligraphy face, one word
 * per step down an almost diagonal line, tilted, and free to spill over the
 * edge of whatever card it sits on. Use it sparingly — the "Let's cook it"
 * banner, the recipe book and the word over the fridge gauge.
 *
 * Words step right by `step` and overlap a little vertically; the last word
 * can be bigger (`grow`), the way the sketch writes a large "it".
 */
export function ScriptTitle({
  words,
  size = 40,
  color = colors.ink,
  outline,
  step = 0.55,
  tilt = -8,
  grow = 1,
  style,
}: {
  words: string[];
  size?: number;
  color?: string;
  /** a soft halo in this colour, so the script reads over pictures and gradients */
  outline?: string;
  /** how far each word moves right, in font sizes */
  step?: number;
  /** degrees; negative climbs to the right */
  tilt?: number;
  /** size multiplier for the last word */
  grow?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      pointerEvents="none"
      accessibilityRole="header"
      accessibilityLabel={words.join(' ')}
      style={[{ transform: [{ rotate: `${tilt}deg` }], alignSelf: 'flex-start' }, style]}
    >
      {words.map((w, i) => {
        const last = i === words.length - 1 && words.length > 1;
        const fs = size * (last ? grow : 1);
        return (
          <Text
            key={i}
            style={{
              fontFamily: font.script,
              fontSize: fs,
              lineHeight: fs * 1.05,
              color,
              marginLeft: i * size * step,
              marginTop: i ? -size * 0.22 : 0,
              textShadowColor: outline,
              textShadowRadius: outline ? 6 : 0,
              textShadowOffset: { width: 0, height: outline ? 1 : 0 },
              // calligraphy swashes overhang the box; don't clip them
              paddingHorizontal: fs * 0.12,
              includeFontPadding: false,
            }}
          >
            {w}
          </Text>
        );
      })}
    </View>
  );
}
