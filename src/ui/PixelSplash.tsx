import React, { useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useStore } from '../state/store';
import { colors, currentTheme } from '../theme';

/**
 * A faint splash of colour made of pixels, like a radial gradient someone
 * dithered by hand: the middle is the deep, saturated tone, it fades through
 * the main tone to the soft one, and the edge breaks up into loose pixels.
 * It should only just be there — seasoning for the pixel rooms, never a
 * pattern you notice before the content.
 */

export type SplashTone = 'coral' | 'lilac' | 'gold' | 'sage';

const tones = (t: SplashTone): [string, string, string] =>
  t === 'lilac'
    ? [colors.lilacDeep, colors.lilac, colors.lilacSoft]
    : t === 'gold'
      ? [colors.goldDeep, colors.gold, colors.goldSoft]
      : t === 'sage'
        ? [colors.sageDeep, colors.sage, colors.sageSoft]
        : [colors.coralDeep, colors.coral, colors.coralSoft];

// a 4x4 ordered-dither matrix: thresholds spread evenly so the fade reads as a gradient
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** The three rings of pixels as SVG paths, inner (deep) first. Pure, so it's memoised. */
function splashPaths(cells: number, px: number, seed: number): [string, string, string] {
  const rand = rng(seed * 7919 + 13);
  const r = cells / 2;
  // a few low bumps on the outline so no two splashes are perfect circles
  const bumps = Array.from({ length: 5 }, () => [rand() * Math.PI * 2, 0.08 + rand() * 0.12] as const);
  const out: [string, string, string] = ['', '', ''];
  for (let j = 0; j < cells; j++) {
    for (let i = 0; i < cells; i++) {
      const dx = i + 0.5 - r;
      const dy = j + 0.5 - r;
      const a = Math.atan2(dy, dx);
      const edge = 1 + bumps.reduce((s, [at, h]) => s + h * Math.cos(a - at) ** 8, 0);
      const d = Math.hypot(dx, dy) / (r * edge);
      if (d >= 1) continue;
      const v = (1 - d) ** 1.4 + (rand() - 0.5) * 0.18;
      if (v < BAYER[(j % 4) * 4 + (i % 4)] * 0.85 + 0.04) continue;
      const tier = v > 0.62 ? 0 : v > 0.32 ? 1 : 2;
      out[tier] += `M${i * px} ${j * px}h${px}v${px}h${-px}z`;
    }
  }
  return out;
}

export function PixelSplash({
  size,
  tone = 'coral',
  pixel = 6,
  seed = 1,
  strength = 1,
  style,
}: {
  /** diameter in points */
  size: number;
  tone?: SplashTone;
  /** one pixel of the splash, in points */
  pixel?: number;
  seed?: number;
  /** 1 is the usual whisper; lower for busy spots */
  strength?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const on = useStore((st) => st.settings.showSplashes) ?? currentTheme().decor;
  const cells = Math.max(4, Math.round(size / pixel));
  const paths = useMemo(() => splashPaths(cells, pixel, seed), [cells, pixel, seed]);
  if (!on) return null;
  const dark = currentTheme().dark;
  // on a dark page the deep tones vanish into it, so the bright tone carries
  // the whole splash there and the opacity alone does the fading
  const fills = dark ? Array(3).fill(tones(tone)[1]) : tones(tone);
  const k = strength * (dark ? 1.3 : 1);
  const alpha = [0.13, 0.09, 0.06];
  const side = cells * pixel;
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: side, height: side }, style]}>
      <Svg width={side} height={side}>
        {[2, 1, 0].map((t) => (
          <Path key={t} d={paths[t]} fill={fills[t]} fillOpacity={alpha[t] * k} />
        ))}
      </Svg>
    </View>
  );
}

/**
 * Splashes behind a scrolling screen: put it first inside <Screen> and give
 * each spot a centre (x as a fraction of the width, y in points from the top).
 * It takes no room in the layout and scrolls with the content.
 */
export function Splashes({
  spots,
  width,
}: {
  spots: { x: number; y: number; size: number; tone?: SplashTone; seed?: number; strength?: number }[];
  width: number;
}) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width, height: 0 }}>
      {spots.map((s, i) => (
        <PixelSplash
          key={i}
          size={s.size}
          tone={s.tone}
          seed={s.seed ?? i + 1}
          strength={s.strength}
          style={{ left: s.x * width - s.size / 2, top: s.y - s.size / 2 }}
        />
      ))}
    </View>
  );
}
