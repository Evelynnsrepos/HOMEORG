import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { RecipeEffort } from '../lib/types';
import { colors } from '../theme';

/**
 * Pieces traced from the iPad sketches: the rainbow effort ring, the wavy
 * fridge gauge and the purple recipe book. All vector, so they scale to any
 * card and cost nothing to ship.
 */

/* ---- helpers ---------------------------------------------------------- */

/** A smooth closed curve through the points (Catmull-Rom, as cubic Béziers). */
export function smoothPath(pts: [number, number][], closed = true): string {
  const n = pts.length;
  const at = (i: number) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${pts[0][0]},${pts[0][1]}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return closed ? d + ' Z' : d;
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(((h % 360) + 360) % 360)}, ${s}%, ${l}%)`;
}

/* ---- effort ring ------------------------------------------------------ */

/**
 * The colour wheel sits still — cyan at the top, green on the left, red at
 * the bottom, magenta on the right — and the effort fills it anticlockwise
 * from the top. A quick dish stays in the cool greens; a project runs all
 * the way round to hot pink. The rest of the ring shows in pastel.
 */
const hueAt = (deg: number) => 180 + deg;

const EFFORT_SHARE: Record<RecipeEffort, number> = { 1: 1 / 3, 2: 2 / 3, 3: 1 };

export function EffortRing({
  effort,
  size = 26,
  stroke,
  share,
}: {
  effort?: RecipeEffort;
  size?: number;
  stroke?: number;
  /** 0-1, overrides effort for the editor's live preview */
  share?: number;
}) {
  const fill = share ?? (effort ? EFFORT_SHARE[effort] : 0);
  const w = stroke ?? Math.max(3, size * 0.2);
  const r = (size - w) / 2 - 0.5;
  const c = size / 2;
  const STEPS = 60;
  const seg = 360 / STEPS;
  const point = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [c + r * Math.cos(a), c + r * Math.sin(a)] as const;
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = point(from);
    const [x2, y2] = point(to);
    return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
  };

  // anticlockwise from the top means the filled part is [360 - fill*360, 360]
  const start = 360 - fill * 360;
  const pieces: React.ReactNode[] = [];
  for (let i = 0; i < STEPS; i++) {
    const from = i * seg;
    const to = from + seg + 0.6; // a hair of overlap hides the seams
    const lit = fill > 0 && from + seg / 2 >= start;
    pieces.push(
      <Path
        key={i}
        d={arc(from, to)}
        stroke={lit ? hsl(hueAt(from + seg / 2), 100, 50) : hsl(hueAt(from + seg / 2), 95, 78)}
        strokeWidth={w}
        fill="none"
      />,
    );
  }
  const [ex, ey] = point(start);
  const [tx, ty] = point(0);

  return (
    <Svg width={size} height={size} accessibilityLabel={effort ? `Effort ${effort} of 3` : 'No effort set'}>
      {pieces}
      {fill > 0 && fill < 1 ? (
        <>
          {/* the rounded tips, the leading one a little proud like the sketch */}
          <Circle cx={tx} cy={ty} r={w / 2} fill={hsl(hueAt(0), 100, 50)} />
          <Circle cx={ex} cy={ey} r={w / 2 + 0.6} fill={hsl(hueAt(start), 100, 50)} stroke="#00000022" strokeWidth={0.6} />
        </>
      ) : null}
    </Svg>
  );
}

/* ---- fridge gauge ----------------------------------------------------- */

// the wavy triangle, traced on a 1000×1000 board and cropped to 100..900 × 190..810
const FRIDGE_POINTS: [number, number][] = [
  [115, 778], [150, 742], [215, 705], [262, 645], [322, 610], [382, 572], [432, 505],
  [482, 467], [560, 433], [612, 385], [652, 322], [692, 296], [748, 272], [790, 218],
  [825, 205], [862, 238], [852, 340], [872, 440], [850, 540], [872, 620], [885, 690],
  [855, 745], [820, 790], [760, 790], [670, 768], [560, 798], [440, 772], [340, 792],
  [255, 770], [175, 790], [125, 790],
];
const FRIDGE_D = smoothPath(FRIDGE_POINTS);
const FX = 100;
const FY = 180;
const FW = 800;
const FH = 640;

/**
 * How full the fridge is, as the sketch has it: the wavy wedge fills from the
 * left in lime through peach to pink, a black bar marks the level, and the
 * rest of the wedge stays blush.
 */
export function FridgeGauge({ level, width = 120 }: { level: number; width?: number }) {
  const pct = Math.max(0, Math.min(1, level));
  const x = 118 + pct * (885 - 118);
  return (
    <View style={{ width, height: (width * FH) / FW }}>
      <Svg width="100%" height="100%" viewBox={`${FX} ${FY} ${FW} ${FH}`}>
        <Defs>
          <LinearGradient id="fridgeFill" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#D9FB7C" />
            <Stop offset="0.3" stopColor="#F7E07C" />
            <Stop offset="0.62" stopColor="#FCAE88" />
            <Stop offset="1" stopColor="#FF7FBF" />
          </LinearGradient>
          <LinearGradient id="fridgeLine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#A4F00C" />
            <Stop offset="0.35" stopColor="#F6C000" />
            <Stop offset="0.6" stopColor="#FF6B1E" />
            <Stop offset="0.85" stopColor="#FF2D5A" />
            <Stop offset="1" stopColor="#FF1A8C" />
          </LinearGradient>
          <ClipPath id="fridgeClip">
            <Path d={FRIDGE_D} />
          </ClipPath>
        </Defs>
        <G clipPath="url(#fridgeClip)">
          <Rect x={FX} y={FY} width={FW} height={FH} fill="#FFDDEA" />
          <Rect x={FX} y={FY} width={x - FX} height={FH} fill="url(#fridgeFill)" />
          <Rect x={x - 9} y={FY} width={18} height={FH} fill="#FF1F6B" />
        </G>
        <Path d={FRIDGE_D} fill="none" stroke="url(#fridgeLine)" strokeWidth={22} strokeLinejoin="round" />
        <Rect x={x + 8} y={200} width={26} height={510} rx={13} fill="#111" />
      </Svg>
    </View>
  );
}

/** The word written over the gauge, and the gauge's own colour at that level. */
export function fridgeWord(level: number): { word: string; color: string } {
  if (level <= 0) return { word: 'Empty', color: '#A4B800' };
  if (level < 0.3) return { word: 'Almost out', color: '#F2A900' };
  if (level < 0.75) return { word: 'Half full', color: '#FF6B1E' };
  return { word: 'Full!', color: '#FF1A8C' };
}

/* ---- recipe book ------------------------------------------------------ */

const BOOK_COVER =
  'M70,205 Q44,214 48,248 L92,738 Q98,778 138,792 L498,902 Q556,912 612,890 L956,682 ' +
  'Q988,660 972,622 L708,138 Q690,108 656,124 L420,250 Z';
const BOOK_PAGES =
  'M74,226 L174,128 Q178,168 190,188 Q330,196 396,244 Q414,268 420,302 Q432,248 470,198 ' +
  'L554,84 Q566,130 584,152 Q636,128 688,140 L946,652 L610,878 Q560,886 508,890 L132,742 Z';

/** The purple open book from the sketch: two flat shapes, a cover peeking out behind white pages. */
export function RecipeBookArt({ size = 64, color = colors.plum }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={(size * 860) / 960} viewBox="30 70 960 860">
      <Path d={BOOK_COVER} fill={color} />
      <Path d={BOOK_PAGES} fill="#FFFFFF" />
    </Svg>
  );
}
