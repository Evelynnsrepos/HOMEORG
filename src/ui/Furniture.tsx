import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';

import type { Kind } from '../data/shop';

/**
 * Every catalogue item is drawn here inside a 100x100 box whose floor line is
 * y = 100. Wall items hang from y = 0. Three palette colours per item:
 * [light, mid, dark/accent].
 */

const R = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  rx = 3,
  extra: object = {},
) => <Rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} {...extra} />;

export function Furniture({ kind, palette }: { kind: Kind; palette: string[] }) {
  const [a, b, c] = palette;

  switch (kind) {
    case 'sofa':
      return (
        <G>
          {R(6, 52, 88, 34, b, 8)}
          {R(10, 40, 80, 26, a, 8)}
          {R(6, 56, 16, 28, c, 7)}
          {R(78, 56, 16, 28, c, 7)}
          {R(26, 58, 22, 16, a, 4)}
          {R(52, 58, 22, 16, a, 4)}
          {R(16, 86, 6, 10, c, 2)}
          {R(78, 86, 6, 10, c, 2)}
        </G>
      );
    case 'armchair':
      return (
        <G>
          {R(22, 50, 56, 34, b, 8)}
          {R(26, 38, 48, 24, a, 9)}
          {R(20, 54, 12, 26, c, 6)}
          {R(68, 54, 12, 26, c, 6)}
          {R(34, 56, 32, 16, a, 4)}
          {R(28, 84, 6, 11, c, 2)}
          {R(66, 84, 6, 11, c, 2)}
        </G>
      );
    case 'stool':
      return (
        <G>
          <Ellipse cx={50} cy={66} rx={22} ry={8} fill={a} />
          {R(28, 66, 44, 6, b, 3)}
          {R(33, 70, 5, 28, c, 2)}
          {R(62, 70, 5, 28, c, 2)}
          {R(33, 82, 34, 4, c, 2)}
        </G>
      );
    case 'bed':
      return (
        <G>
          {R(8, 34, 14, 58, c, 5)}
          {R(12, 52, 80, 34, b, 6)}
          {R(12, 52, 80, 12, a, 6)}
          {R(20, 44, 26, 14, a, 5)}
          {R(48, 46, 40, 10, c, 4)}
          {R(16, 86, 6, 10, c, 2)}
          {R(82, 86, 6, 10, c, 2)}
        </G>
      );
    case 'coffeeTable':
      return (
        <G>
          {R(14, 56, 72, 8, a, 4)}
          {R(20, 64, 5, 30, c, 2)}
          {R(75, 64, 5, 30, c, 2)}
          {R(22, 76, 56, 4, b, 2)}
        </G>
      );
    case 'diningTable':
      return (
        <G>
          {R(6, 44, 88, 9, a, 4)}
          {R(14, 53, 6, 42, c, 2)}
          {R(80, 53, 6, 42, c, 2)}
          {R(16, 68, 68, 5, b, 2)}
          {R(30, 60, 14, 28, b, 3)}
          {R(56, 60, 14, 28, b, 3)}
        </G>
      );
    case 'desk':
      return (
        <G>
          {R(8, 48, 84, 8, a, 3)}
          {R(12, 56, 5, 40, c, 2)}
          {R(83, 56, 5, 40, c, 2)}
          {R(56, 56, 32, 26, b, 3)}
          {R(60, 62, 24, 4, a, 2)}
          {R(60, 70, 24, 4, a, 2)}
          {R(26, 30, 32, 20, c, 3)}
          {R(29, 33, 26, 14, a, 2)}
          {R(40, 50, 5, 6, c, 1)}
        </G>
      );
    case 'sideboard':
      return (
        <G>
          {R(8, 50, 84, 36, b, 5)}
          {R(8, 46, 84, 6, a, 3)}
          {R(14, 56, 34, 24, a, 3)}
          {R(52, 56, 34, 24, a, 3)}
          <Circle cx={31} cy={68} r={2.4} fill={c} />
          <Circle cx={69} cy={68} r={2.4} fill={c} />
          {R(16, 86, 5, 10, c, 2)}
          {R(79, 86, 5, 10, c, 2)}
        </G>
      );
    case 'bookcase':
      return (
        <G>
          {R(16, 18, 68, 78, b, 4)}
          {R(20, 22, 60, 70, a, 3)}
          {R(20, 40, 60, 3, b)}
          {R(20, 58, 60, 3, b)}
          {R(20, 76, 60, 3, b)}
          {R(24, 26, 5, 14, c, 1)}
          {R(30, 28, 4, 12, a, 1)}
          {R(35, 25, 6, 15, c, 1)}
          {R(24, 45, 7, 13, c, 1)}
          {R(32, 47, 4, 11, a, 1)}
          {R(58, 44, 6, 14, c, 1)}
          {R(26, 63, 5, 13, c, 1)}
          {R(62, 62, 8, 14, a, 1)}
          {R(24, 81, 6, 11, c, 1)}
        </G>
      );
    case 'wardrobe':
      return (
        <G>
          {R(20, 12, 60, 84, b, 5)}
          {R(24, 16, 25, 76, a, 3)}
          {R(51, 16, 25, 76, a, 3)}
          <Circle cx={46} cy={54} r={2.2} fill={c} />
          <Circle cx={54} cy={54} r={2.2} fill={c} />
        </G>
      );
    case 'rug':
      return (
        <G>
          <Ellipse cx={50} cy={84} rx={46} ry={13} fill={b} />
          <Ellipse cx={50} cy={84} rx={34} ry={9} fill={a} />
          <Ellipse cx={50} cy={84} rx={16} ry={4.5} fill={c} />
        </G>
      );
    case 'plantTall':
      return (
        <G>
          <Path d="M50 96 L50 46" stroke={b} strokeWidth={3.5} />
          <Ellipse cx={34} cy={44} rx={16} ry={10} fill={a} transform="rotate(-22 34 44)" />
          <Ellipse cx={66} cy={40} rx={16} ry={10} fill={b} transform="rotate(20 66 40)" />
          <Ellipse cx={44} cy={24} rx={15} ry={10} fill={a} transform="rotate(-12 44 24)" />
          <Ellipse cx={62} cy={18} rx={13} ry={9} fill={b} transform="rotate(14 62 18)" />
          <Path d="M36 74 L64 74 L60 98 L40 98 Z" fill={c} />
          {R(34, 70, 32, 7, c, 2)}
        </G>
      );
    case 'plantSmall':
      return (
        <G>
          <Ellipse cx={38} cy={58} rx={13} ry={8} fill={a} transform="rotate(-24 38 58)" />
          <Ellipse cx={62} cy={56} rx={13} ry={8} fill={b} transform="rotate(24 62 56)" />
          <Ellipse cx={50} cy={46} rx={11} ry={8} fill={a} />
          <Path d="M40 74 L60 74 L57 96 L43 96 Z" fill={c} />
          {R(38, 70, 24, 6, c, 2)}
        </G>
      );
    case 'cactus':
      return (
        <G>
          {R(42, 34, 16, 44, a, 8)}
          {R(24, 48, 12, 24, a, 6)}
          {R(64, 42, 12, 30, b, 6)}
          {R(24, 62, 20, 8, a, 4)}
          {R(58, 56, 18, 8, b, 4)}
          <Path d="M38 78 L62 78 L59 96 L41 96 Z" fill={c} />
        </G>
      );
    case 'floorLamp':
      return (
        <G>
          <Path d="M50 96 L50 34" stroke={c} strokeWidth={3} />
          <Path d="M34 34 L66 34 L60 12 L40 12 Z" fill={a} />
          {R(36, 32, 28, 4, b, 2)}
          <Ellipse cx={50} cy={96} rx={16} ry={4} fill={c} />
        </G>
      );
    case 'tableLamp':
      return (
        <G>
          <Path d="M36 52 L64 52 L58 30 L42 30 Z" fill={a} />
          {R(47, 52, 6, 26, b, 2)}
          <Ellipse cx={50} cy={82} rx={16} ry={5} fill={c} />
        </G>
      );
    case 'pendant':
      return (
        <G>
          <Path d="M50 0 L50 26" stroke={c} strokeWidth={2} />
          <Path d="M30 54 L70 54 L60 26 L40 26 Z" fill={a} />
          <Ellipse cx={50} cy={54} rx={20} ry={5} fill={b} />
          <Circle cx={50} cy={60} r={5} fill={c} opacity={0.5} />
        </G>
      );
    case 'shelf':
      return (
        <G>
          {R(10, 46, 80, 7, a, 3)}
          {R(16, 53, 4, 8, c, 1)}
          {R(80, 53, 4, 8, c, 1)}
          {R(22, 26, 6, 20, b, 1)}
          {R(29, 30, 5, 16, c, 1)}
          {R(35, 24, 7, 22, b, 1)}
          <Ellipse cx={64} cy={38} rx={11} ry={7} fill={c} />
          {R(59, 38, 10, 8, b, 2)}
        </G>
      );
    case 'artFrame':
      return (
        <G>
          {R(16, 14, 68, 56, c, 4)}
          {R(21, 19, 58, 46, a, 2)}
          <Circle cx={38} cy={38} r={11} fill={b} />
          <Path d="M24 62 L44 40 L60 62 Z" fill={c} opacity={0.7} />
          <Path d="M52 62 L68 44 L78 62 Z" fill={b} opacity={0.8} />
        </G>
      );
    case 'mirror':
      return (
        <G>
          <Circle cx={50} cy={44} r={32} fill={c} />
          <Circle cx={50} cy={44} r={27} fill={a} />
          <Path d="M34 62 Q44 34 66 26" stroke={b} strokeWidth={5} fill="none" opacity={0.8} />
        </G>
      );
    case 'clock':
      return (
        <G>
          <Circle cx={50} cy={44} r={30} fill={c} />
          <Circle cx={50} cy={44} r={25} fill={a} />
          <Line x1={50} y1={44} x2={50} y2={26} stroke={b} strokeWidth={3} strokeLinecap="round" />
          <Line x1={50} y1={44} x2={63} y2={50} stroke={b} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={50} cy={44} r={2.6} fill={b} />
        </G>
      );
    case 'windowBox':
      return (
        <G>
          {R(12, 8, 76, 62, c, 4)}
          {R(17, 13, 66, 52, a, 2)}
          <Line x1={50} y1={13} x2={50} y2={65} stroke={c} strokeWidth={4} />
          <Line x1={17} y1={39} x2={83} y2={39} stroke={c} strokeWidth={4} />
          {R(10, 70, 80, 7, c, 2)}
          <Ellipse cx={30} cy={68} rx={10} ry={6} fill={b} />
          <Ellipse cx={68} cy={68} rx={10} ry={6} fill={b} />
        </G>
      );
    case 'tv':
      return (
        <G>
          {R(8, 18, 84, 50, a, 4)}
          {R(12, 22, 76, 42, b, 2)}
          {R(44, 68, 12, 8, a, 1)}
          {R(30, 76, 40, 5, a, 2)}
        </G>
      );
    case 'basket':
      return (
        <G>
          <Path d="M26 58 L74 58 L68 96 L32 96 Z" fill={a} />
          <Path d="M26 58 L74 58 L72 66 L28 66 Z" fill={b} />
          <Line x1={40} y1={66} x2={38} y2={96} stroke={c} strokeWidth={1.6} opacity={0.5} />
          <Line x1={52} y1={66} x2={52} y2={96} stroke={c} strokeWidth={1.6} opacity={0.5} />
          <Line x1={64} y1={66} x2={66} y2={96} stroke={c} strokeWidth={1.6} opacity={0.5} />
        </G>
      );
    case 'petBed':
      return (
        <G>
          <Ellipse cx={50} cy={82} rx={38} ry={16} fill={b} />
          <Ellipse cx={50} cy={80} rx={28} ry={11} fill={a} />
          <Ellipse cx={54} cy={74} rx={16} ry={9} fill={c} />
          <Circle cx={45} cy={70} r={4} fill={c} />
          <Circle cx={63} cy={70} r={4} fill={c} />
        </G>
      );
    case 'beanbag':
      return (
        <G>
          <Path d="M18 96 Q10 60 40 50 Q76 40 84 74 Q88 96 78 96 Z" fill={b} />
          <Path d="M30 92 Q26 66 48 58 Q70 52 74 76" fill="none" stroke={a} strokeWidth={5} />
          <Ellipse cx={50} cy={96} rx={36} ry={4} fill={c} opacity={0.4} />
        </G>
      );
    case 'fireplace':
      return (
        <G>
          {R(14, 30, 72, 62, a, 5)}
          {R(24, 44, 52, 40, b, 4)}
          {R(30, 52, 40, 30, c, 3)}
          <Path d="M50 78 Q44 68 50 60 Q56 68 50 78 Z" fill={a} opacity={0.9} />
          {R(10, 24, 80, 8, b, 3)}
        </G>
      );
    case 'piano':
      return (
        <G>
          {R(12, 30, 76, 46, a, 4)}
          {R(16, 34, 68, 22, b, 2)}
          {R(12, 56, 76, 10, c, 2)}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Rect key={i} x={17 + i * 6.8} y={57} width={5.4} height={8} rx={1} fill="#F4EEE3" />
          ))}
          {R(18, 76, 8, 20, b, 2)}
          {R(74, 76, 8, 20, b, 2)}
        </G>
      );
    case 'aquarium':
      return (
        <G>
          {R(16, 34, 68, 46, c, 4)}
          {R(20, 38, 60, 38, a, 3)}
          {R(20, 50, 60, 26, b, 2)}
          <Circle cx={38} cy={60} r={4} fill={c} />
          <Circle cx={58} cy={66} r={3} fill={c} />
          <Path d="M28 76 Q34 62 40 76" fill={c} opacity={0.5} />
          {R(14, 80, 72, 16, c, 3)}
        </G>
      );
    case 'toybox':
      return (
        <G>
          {R(18, 52, 64, 42, a, 5)}
          {R(18, 46, 64, 10, b, 4)}
          <Circle cx={36} cy={72} r={7} fill={b} />
          <Circle cx={56} cy={70} r={5} fill={c} />
          {R(62, 74, 12, 12, c, 2)}
        </G>
      );
    case 'easel':
      return (
        <G>
          <Path d="M50 22 L28 96" stroke={b} strokeWidth={4} />
          <Path d="M50 22 L72 96" stroke={b} strokeWidth={4} />
          <Path d="M50 22 L50 84" stroke={b} strokeWidth={3} />
          {R(24, 20, 52, 44, c, 3)}
          {R(28, 24, 44, 36, a, 2)}
          {R(30, 62, 40, 5, b, 2)}
        </G>
      );
    case 'guitar':
      return (
        <G>
          <Ellipse cx={50} cy={72} rx={22} ry={24} fill={a} />
          <Ellipse cx={50} cy={62} rx={17} ry={16} fill={a} />
          <Circle cx={50} cy={68} r={7} fill={c} />
          {R(46, 16, 8, 44, b, 2)}
          {R(43, 10, 14, 9, c, 2)}
        </G>
      );
    case 'candles':
      return (
        <G>
          {R(34, 56, 8, 34, a, 2)}
          {R(46, 48, 8, 42, a, 2)}
          {R(58, 62, 8, 28, a, 2)}
          <Ellipse cx={38} cy={54} rx={3} ry={5} fill={c} />
          <Ellipse cx={50} cy={46} rx={3} ry={5} fill={c} />
          <Ellipse cx={62} cy={60} rx={3} ry={5} fill={c} />
          <Ellipse cx={50} cy={92} rx={26} ry={5} fill={b} />
        </G>
      );
    case 'vase':
      return (
        <G>
          <Path d="M40 96 Q32 70 44 60 L56 60 Q68 70 60 96 Z" fill={a} />
          <Path d="M50 60 L50 32" stroke={c} strokeWidth={2.5} />
          <Ellipse cx={42} cy={34} rx={8} ry={5} fill={c} transform="rotate(-25 42 34)" />
          <Ellipse cx={58} cy={28} rx={8} ry={5} fill={c} transform="rotate(25 58 28)" />
          <Circle cx={50} cy={22} r={6} fill={b} />
        </G>
      );
    case 'garland':
      return (
        <G>
          <Path d="M4 12 Q50 46 96 12" fill="none" stroke={c} strokeWidth={2} />
          {[10, 24, 38, 50, 62, 76, 90].map((x, i) => {
            const y = 12 + Math.sin((i / 6) * Math.PI) * 30;
            return (
              <Ellipse
                key={x}
                cx={x}
                cy={y + 4}
                rx={7}
                ry={5}
                fill={i % 2 ? a : b}
                transform={`rotate(${i % 2 ? 20 : -20} ${x} ${y})`}
              />
            );
          })}
        </G>
      );
    case 'tree':
      return (
        <G>
          <Polygon points="50,8 74,44 26,44" fill={a} />
          <Polygon points="50,26 80,66 20,66" fill={b} />
          <Polygon points="50,46 86,86 14,86" fill={a} />
          {R(44, 86, 12, 10, c, 2)}
          <Circle cx={40} cy={58} r={3} fill={c} />
          <Circle cx={62} cy={72} r={3} fill={c} />
          <Circle cx={50} cy={38} r={3} fill={c} />
        </G>
      );
    case 'pumpkin':
      return (
        <G>
          <Ellipse cx={38} cy={76} rx={24} ry={20} fill={a} />
          <Ellipse cx={38} cy={76} rx={9} ry={20} fill={b} opacity={0.55} />
          {R(35, 52, 6, 8, c, 2)}
          <Ellipse cx={72} cy={84} rx={16} ry={13} fill={b} />
          {R(70, 68, 5, 6, c, 2)}
        </G>
      );
    case 'lantern':
      return (
        <G>
          <Path d="M50 18 Q34 18 34 30" fill="none" stroke={b} strokeWidth={2.5} />
          <Path d="M50 18 Q66 18 66 30" fill="none" stroke={b} strokeWidth={2.5} />
          {R(32, 30, 36, 46, b, 4)}
          {R(37, 36, 26, 34, a, 2)}
          <Ellipse cx={50} cy={54} rx={7} ry={10} fill={c} />
          {R(28, 76, 44, 7, b, 2)}
        </G>
      );
    default:
      return (
        <G>
          <Circle cx={50} cy={62} r={26} fill={a} />
          <Circle cx={50} cy={62} r={16} fill={b} />
        </G>
      );
  }
}

/** A standalone tile of one item — used by the shop grid and the storage list. */
export function FurnitureTile({
  kind,
  palette,
  size = 76,
}: {
  kind: Kind;
  palette: string[];
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Furniture kind={kind} palette={palette} />
    </Svg>
  );
}
