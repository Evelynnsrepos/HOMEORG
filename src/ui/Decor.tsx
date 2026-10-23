import React from 'react';
import { StyleProp, View, ViewStyle, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * The kawaii dressing: ivy hanging off the top of a screen, warm Edison bulbs
 * on their cords, and pink stickers with faces. All drawn here, nothing
 * downloaded, so it works offline and costs a few kilobytes.
 */

/* ---- ivy -------------------------------------------------------------- */

/** One ivy leaf hanging from (0,0), pointing down, about 16 units long. */
const LEAF =
  'M0,0 C-3,1 -7,0 -9,3 C-7,4 -6,5 -6,7 C-8,8 -9,11 -7,13 C-4,12 -2,13 0,16 ' +
  'C2,13 4,12 7,13 C9,11 8,8 6,7 C6,5 7,4 9,3 C7,0 3,1 0,0 Z';
const VEIN = 'M0,1 L0,14 M0,6 L-6,4 M0,6 L6,4 M0,9.5 L-5.5,11.5 M0,9.5 L5.5,11.5';
const GREENS = ['#3E8E4E', '#5BAF5E', '#2F7340', '#6BBF6A', '#47995A'];

/** Same layout every render: a tiny seeded random. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Leaf({ x, y, angle, scale, color }: { x: number; y: number; angle: number; scale: number; color: string }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <Path d={LEAF} fill={color} />
      <Path d={VEIN} stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={0.7} fill="none" />
    </G>
  );
}

/**
 * A strand that hangs from (x,0) down to `length`, swaying a little, with
 * leaves on alternate sides.
 */
function Strand({ x, length, seed }: { x: number; length: number; seed: number }) {
  const r = rng(seed);
  const sway = 6 + r() * 6;
  const d = `M${x},0 C${x + sway},${length * 0.3} ${x - sway},${length * 0.65} ${x + sway * 0.4},${length}`;
  const leaves: React.ReactNode[] = [];
  const n = Math.max(2, Math.floor(length / 13));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    // a point on the curve, near enough for leaves
    const lx = x + Math.sin(t * Math.PI * 1.4) * sway * 0.6;
    const ly = t * length;
    const side = i % 2 ? -1 : 1;
    leaves.push(
      <Leaf
        key={i}
        x={lx}
        y={ly - 2}
        angle={side * (25 + r() * 30)}
        scale={0.55 + r() * 0.45 * (1 - t * 0.4)}
        color={GREENS[Math.floor(r() * GREENS.length)]}
      />,
    );
  }
  return (
    <G>
      <Path d={d} stroke="#4E7F3E" strokeWidth={1.1} fill="none" />
      {leaves}
    </G>
  );
}

/* ---- bulbs ------------------------------------------------------------ */

function Bulb({ x, cord, scale = 1, id }: { x: number; cord: number; scale?: number; id: string }) {
  return (
    <G>
      <Line x1={x} y1={0} x2={x} y2={cord} stroke="#2B2320" strokeWidth={1.2} />
      <G transform={`translate(${x} ${cord}) scale(${scale})`}>
        <Circle cx={0} cy={18} r={22} fill={`url(#${id})`} />
        {/* socket */}
        <Rect x={-4.5} y={0} width={9} height={9} rx={1.5} fill="#3B302A" />
        <Rect x={-4.5} y={2.5} width={9} height={1.2} fill="#6E5E52" />
        <Rect x={-4.5} y={5.5} width={9} height={1.2} fill="#6E5E52" />
        {/* glass */}
        <Path
          d="M-4,9 C-4,12 -8,15 -8,21 C-8,27 -4,30 0,30 C4,30 8,27 8,21 C8,15 4,12 4,9 Z"
          fill="#FFE7A8"
          fillOpacity={0.9}
          stroke="#F6C76A"
          strokeWidth={0.6}
        />
        {/* filament */}
        <Path d="M-2,11 L-2,20 L-1,24 L0,20 L1,24 L2,20 L2,11" stroke="#FF9A1F" strokeWidth={0.9} fill="none" />
        <Ellipse cx={-3.5} cy={18} rx={1.2} ry={4} fill="#FFFFFF" fillOpacity={0.6} />
      </G>
    </G>
  );
}

/* ---- the garland ------------------------------------------------------ */

/**
 * The top of a screen: a vine along the edge with strands falling at the
 * sides, and a few warm bulbs hanging between them. Sits behind the header,
 * so it never takes taps.
 */
export function Garland({
  width,
  height = 96,
  bulbs = 3,
  seed = 7,
  style,
}: {
  width: number;
  height?: number;
  bulbs?: number;
  seed?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const r = rng(seed);
  const strands = [
    { x: 8, length: height * 0.95 },
    { x: 24, length: height * 0.55 },
    { x: width * 0.38, length: height * 0.3 },
    { x: width * 0.62, length: height * 0.25 },
    { x: width - 26, length: height * 0.6 },
    { x: width - 9, length: height * 0.9 },
  ];
  const top = `M0,2 C${width * 0.25},10 ${width * 0.4},-2 ${width * 0.5},4 C${width * 0.6},10 ${width * 0.8},-2 ${width},3`;
  const topLeaves: React.ReactNode[] = [];
  for (let i = 0; i < width / 16; i++) {
    const x = i * 16 + r() * 8;
    topLeaves.push(
      <Leaf key={i} x={x} y={3 + r() * 3} angle={(r() - 0.5) * 120} scale={0.5 + r() * 0.35} color={GREENS[Math.floor(r() * GREENS.length)]} />,
    );
  }
  const bulbXs = Array.from({ length: bulbs }, (_, i) => width * (0.22 + (0.56 * (i + 0.5)) / bulbs) + (r() - 0.5) * 16);

  return (
    <View pointerEvents="none" style={[{ width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFD27A" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#FFD27A" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {bulbXs.map((x, i) => (
          <Bulb key={i} id="glow" x={x} cord={14 + ((i * 37) % 3) * 12 + r() * 6} scale={0.85 + r() * 0.3} />
        ))}
        <Path d={top} stroke="#4E7F3E" strokeWidth={1.4} fill="none" />
        {strands.map((s, i) => (
          <Strand key={i} x={s.x} length={s.length} seed={seed * 31 + i * 7} />
        ))}
        {topLeaves}
      </Svg>
    </View>
  );
}

/* ---- stickers --------------------------------------------------------- */

export type StickerKind = 'heart' | 'cat' | 'icecream' | 'cake' | 'present' | 'star';

const INK = '#4A2C3E';
const BLUSH = '#FF4F8B';

/** Two dot eyes with a shine, blush and a small smile, centred on (cx, cy). */
function Face({ cx, cy, s = 1, cat }: { cx: number; cy: number; s?: number; cat?: boolean }) {
  return (
    <G transform={`translate(${cx} ${cy}) scale(${s})`}>
      <Ellipse cx={-11} cy={0} rx={3.6} ry={4.4} fill={INK} />
      <Ellipse cx={11} cy={0} rx={3.6} ry={4.4} fill={INK} />
      <Circle cx={-9.8} cy={-1.6} r={1.3} fill="#FFF" />
      <Circle cx={12.2} cy={-1.6} r={1.3} fill="#FFF" />
      <Ellipse cx={-18} cy={8} rx={5.5} ry={3.2} fill={BLUSH} fillOpacity={0.45} />
      <Ellipse cx={18} cy={8} rx={5.5} ry={3.2} fill={BLUSH} fillOpacity={0.45} />
      <Path
        d={cat ? 'M-6,6 Q-3,10 0,6 Q3,10 6,6' : 'M-4,6 Q0,10.5 4,6'}
        stroke={INK}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

const STICKERS: Record<StickerKind, { outline: string; body: React.ReactNode }> = {
  heart: {
    outline: 'M50,88 C20,68 6,50 10,32 C14,16 34,12 50,28 C66,12 86,16 90,32 C94,50 80,68 50,88 Z',
    body: (
      <>
        <Path d="M50,88 C20,68 6,50 10,32 C14,16 34,12 50,28 C66,12 86,16 90,32 C94,50 80,68 50,88 Z" fill="#FF8FB8" />
        <Path d="M22,30 C24,24 30,22 34,24" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" fill="none" />
        <Face cx={50} cy={46} />
      </>
    ),
  },
  cat: {
    outline: 'M18,42 L20,10 L42,28 Q50,26 58,28 L80,10 L82,42 Q92,60 80,76 Q66,92 50,92 Q34,92 20,76 Q8,60 18,42 Z',
    body: (
      <>
        <Path d="M18,42 L20,10 L42,28 Q50,26 58,28 L80,10 L82,42 Q92,60 80,76 Q66,92 50,92 Q34,92 20,76 Q8,60 18,42 Z" fill="#FFB3CF" />
        <Path d="M24,20 L36,30 L25,36 Z M76,20 L64,30 L75,36 Z" fill="#FF7FAE" />
        <Face cx={50} cy={56} cat />
        <Path d="M10,60 L26,62 M10,68 L26,66 M90,60 L74,62 M90,68 L74,66" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      </>
    ),
  },
  icecream: {
    outline: 'M26,54 C20,30 36,12 50,12 C64,12 80,30 74,54 L66,54 L50,95 L34,54 Z',
    body: (
      <>
        <Path d="M33,52 L50,95 L67,52 Z" fill="#F6C98C" />
        <Path d="M38,58 L58,80 M46,54 L62,70 M62,58 L44,80 M54,54 L39,70" stroke="#E0A262" strokeWidth={1.5} />
        <Path d="M26,56 C20,30 36,14 50,14 C64,14 80,30 74,56 Q68,51 62,57 Q56,51 50,57 Q44,51 38,57 Q32,51 26,56 Z" fill="#FF9CC4" />
        <Circle cx={50} cy={11} r={6} fill="#FF3E7F" />
        <Path d="M50,6 Q54,0 58,2" stroke="#4E7F3E" strokeWidth={1.6} fill="none" />
        <Face cx={50} cy={36} s={0.85} />
      </>
    ),
  },
  cake: {
    outline: 'M12,50 L74,24 Q80,22 84,30 L90,44 L90,82 Q90,86 86,86 L16,90 Q12,90 12,86 Z',
    body: (
      <>
        <Path d="M12,52 L90,46 L90,82 Q90,86 86,86 L16,90 Q12,90 12,86 Z" fill="#FFF3E8" />
        <Path d="M12,66 L90,61 L90,69 L12,74 Z" fill="#FFB3CF" />
        <Path d="M12,50 L74,24 Q80,22 84,30 L90,44 L90,48 Q84,54 80,48 Q74,56 68,49 Q62,57 56,50 Q50,58 44,51 Q38,59 32,52 Q26,60 20,53 Q15,58 12,52 Z" fill="#FF8FB8" />
        <Circle cx={74} cy={22} r={6} fill="#FF3E7F" />
        <Face cx={51} cy={77} s={0.7} />
      </>
    ),
  },
  present: {
    outline: 'M50,34 C36,14 22,22 32,34 L16,34 L16,48 L20,48 L20,88 L80,88 L80,48 L84,48 L84,34 L68,34 C78,22 64,14 50,34 Z',
    body: (
      <>
        <Rect x={20} y={46} width={60} height={42} rx={3} fill="#FF8FB8" />
        <Rect x={16} y={34} width={68} height={14} rx={3} fill="#FFB3CF" />
        <Rect x={45} y={34} width={10} height={54} fill="#FFE07A" />
        <Path d="M50,34 C36,14 22,22 32,34 Z M50,34 C64,14 78,22 68,34 Z" fill="#FFE07A" />
        <Face cx={50} cy={66} s={0.7} />
      </>
    ),
  },
  star: {
    outline: 'M50,8 L61,36 L91,38 L68,57 L76,88 L50,71 L24,88 L32,57 L9,38 L39,36 Z',
    body: (
      <>
        <Path d="M50,8 L61,36 L91,38 L68,57 L76,88 L50,71 L24,88 L32,57 L9,38 L39,36 Z" fill="#FFA8C8" strokeLinejoin="round" stroke="#FFA8C8" strokeWidth={6} />
        <Face cx={50} cy={50} s={0.75} />
      </>
    ),
  },
};

/** A die-cut sticker: white border, a soft drop shadow, a little tilt. */
export function Sticker({
  kind,
  size = 48,
  tilt = 0,
  style,
}: {
  kind: StickerKind;
  size?: number;
  tilt?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const s = STICKERS[kind];
  return (
    <View pointerEvents="none" style={[{ width: size, height: size, transform: [{ rotate: `${tilt}deg` }] }, style]}>
      <Svg width={size} height={size} viewBox="-6 -6 112 112">
        <Path d={s.outline} transform="translate(2 3)" fill="#C2507F" fillOpacity={0.18} stroke="#C2507F" strokeOpacity={0.18} strokeWidth={12} strokeLinejoin="round" />
        <Path d={s.outline} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={12} strokeLinejoin="round" />
        {s.body}
      </Svg>
    </View>
  );
}

/**
 * The garland as the first thing inside a <Screen>: full bleed past the
 * screen's side padding, tucked up into the top inset, and overlapping the
 * header a little so it doesn't push everything down.
 */
export function ScreenGarland({ seed = 7, bulbs = 3, height = 70 }: { seed?: number; bulbs?: number; height?: number }) {
  const { width } = useWindowDimensions();
  return (
    <Garland
      width={Math.min(width, 520)}
      height={height}
      bulbs={bulbs}
      seed={seed}
      style={{ marginHorizontal: -16, marginTop: -8, marginBottom: -Math.round(height * 0.3) }}
    />
  );
}
