import React from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

/**
 * What's already built into a room — the bath, the kitchen units, the bed.
 * Drawn in the same 200x120 room box as RoomCanvas, floor line at y = 88, so
 * every room reads as a room before you have bought a single thing.
 */

const FLOOR = 88;

const c = {
  unit: '#E2D2B8',
  unitDark: '#C9B292',
  edge: '#B29A79',
  porcelain: '#F5F2EA',
  porcelainEdge: '#D9D3C4',
  metal: '#C3C2B8',
  glass: '#CFE1E6',
  soft: '#E8DECB',
  dark: '#9C8A6D',
};

const R = (x: number, y: number, w: number, h: number, fill: string, rx = 2) => (
  <Rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} />
);

function Skirting() {
  return (
    <G>
      <Rect x={0} y={FLOOR - 6} width={200} height={6} fill="#00000010" />
      <Rect x={0} y={FLOOR - 6} width={200} height={2} fill="#FFFFFF35" />
    </G>
  );
}

function Socket({ x }: { x: number }) {
  return (
    <G>
      {R(x, 72, 7, 6, '#00000012', 1)}
      <Circle cx={x + 2.2} cy={75} r={0.8} fill="#00000025" />
      <Circle cx={x + 4.8} cy={75} r={0.8} fill="#00000025" />
    </G>
  );
}

function Window({ x, w = 42 }: { x: number; w?: number }) {
  return (
    <G>
      {R(x - 3, 12, w + 6, 40, c.soft, 3)}
      {R(x, 15, w, 34, c.glass, 2)}
      <Line x1={x + w / 2} y1={15} x2={x + w / 2} y2={49} stroke={c.soft} strokeWidth={3} />
      <Line x1={x} y1={32} x2={x + w} y2={32} stroke={c.soft} strokeWidth={3} />
      {R(x - 5, 51, w + 10, 4, c.unitDark, 1)}
    </G>
  );
}

function Radiator({ x }: { x: number }) {
  return (
    <G>
      {R(x, 66, 34, 20, c.porcelain, 2)}
      {[0, 1, 2, 3, 4].map((i) => (
        <Rect key={i} x={x + 3 + i * 6} y={69} width={3} height={14} rx={1} fill={c.porcelainEdge} />
      ))}
    </G>
  );
}

function Bed({ x, w = 76 }: { x: number; w?: number }) {
  return (
    <G>
      {R(x, 42, 9, 44, c.edge, 3)}
      {R(x + 7, 62, w, 24, c.soft, 3)}
      {R(x + 7, 62, w, 8, c.porcelain, 3)}
      {R(x + 12, 53, 26, 12, c.porcelain, 4)}
      {R(x + 40, 57, w - 36, 7, c.unitDark, 3)}
      {R(x + 9, 86, 5, 5, c.edge, 1)}
      {R(x + w - 1, 86, 5, 5, c.edge, 1)}
    </G>
  );
}

export function Fixtures({ typeId }: { typeId: string }) {
  switch (typeId) {
    case 'kitchen':
      return (
        <G>
          {/* upper cupboards */}
          {R(8, 12, 78, 30, c.unit, 3)}
          <Line x1={47} y1={12} x2={47} y2={42} stroke={c.edge} strokeWidth={1.5} />
          {R(40, 24, 3, 8, c.metal, 1)}
          {R(51, 24, 3, 8, c.metal, 1)}
          {/* base units + worktop */}
          {R(6, 62, 118, 26, c.unit, 2)}
          {R(4, 58, 122, 6, c.unitDark, 2)}
          <Line x1={46} y1={64} x2={46} y2={88} stroke={c.edge} strokeWidth={1.5} />
          <Line x1={86} y1={64} x2={86} y2={88} stroke={c.edge} strokeWidth={1.5} />
          {R(24, 71, 3, 7, c.metal, 1)}
          {R(64, 71, 3, 7, c.metal, 1)}
          {/* sink */}
          {R(14, 51, 26, 8, c.porcelain, 2)}
          <Path d="M27 51 q0 -9 8 -9" stroke={c.metal} strokeWidth={2} fill="none" />
          {/* hob */}
          <Circle cx={58} cy={55} r={3.6} fill={c.dark} opacity={0.45} />
          <Circle cx={72} cy={55} r={3.6} fill={c.dark} opacity={0.45} />
          {/* fridge */}
          {R(132, 36, 34, 52, c.porcelain, 3)}
          <Line x1={132} y1={57} x2={166} y2={57} stroke={c.porcelainEdge} strokeWidth={1.5} />
          {R(160, 46, 2.5, 7, c.metal, 1)}
          {R(160, 62, 2.5, 7, c.metal, 1)}
          <Skirting />
        </G>
      );

    case 'bathroom':
      return (
        <G>
          {/* bath */}
          {R(8, 60, 84, 26, c.porcelain, 8)}
          {R(13, 64, 74, 17, c.glass, 6)}
          <Path d="M86 60 q0 -11 -8 -11" stroke={c.metal} strokeWidth={2.2} fill="none" />
          {/* tiles behind */}
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3, 4].map((i) => (
              <Rect
                key={`${r}-${i}`}
                x={6 + i * 18}
                y={20 + r * 13}
                width={16}
                height={11}
                rx={1.5}
                fill="#FFFFFF28"
              />
            )),
          )}
          {/* basin + mirror */}
          {R(122, 56, 44, 11, c.porcelain, 4)}
          {R(138, 67, 12, 19, c.porcelain, 2)}
          <Path d="M144 56 q0 -8 6 -8" stroke={c.metal} strokeWidth={2} fill="none" />
          <Circle cx={144} cy={32} r={17} fill={c.glass} />
          <Circle cx={144} cy={32} r={17} fill="none" stroke={c.porcelainEdge} strokeWidth={2} />
          <Skirting />
        </G>
      );

    case 'wc':
      return (
        <G>
          {R(24, 44, 26, 22, c.porcelain, 3)}
          <Ellipse cx={37} cy={74} rx={17} ry={11} fill={c.porcelain} />
          <Ellipse cx={37} cy={73} rx={11} ry={6} fill={c.glass} />
          {R(30, 66, 14, 15, c.porcelain, 3)}
          {R(120, 58, 34, 9, c.porcelain, 4)}
          {R(132, 67, 10, 18, c.porcelain, 2)}
          <Circle cx={137} cy={34} r={14} fill={c.glass} />
          <Skirting />
        </G>
      );

    case 'bedroom':
    case 'guest':
      return (
        <G>
          <Window x={132} w={44} />
          <Bed x={12} />
          <Skirting />
          <Socket x={112} />
        </G>
      );

    case 'kids':
      return (
        <G>
          <Window x={140} w={38} />
          <Bed x={10} w={58} />
          {R(96, 24, 46, 6, c.unit, 2)}
          {R(101, 14, 6, 10, '#E7A98C', 1)}
          {R(109, 16, 5, 8, '#8FB59A', 1)}
          {R(116, 12, 7, 12, '#E3AE45', 1)}
          <Skirting />
        </G>
      );

    case 'living':
      return (
        <G>
          <Window x={128} w={52} />
          <Radiator x={132} />
          <Skirting />
          <Socket x={22} />
        </G>
      );

    case 'dining':
      return (
        <G>
          <Window x={78} w={48} />
          <Skirting />
          <Socket x={18} />
        </G>
      );

    case 'office':
      return (
        <G>
          <Window x={126} w={46} />
          <Skirting />
          <Socket x={20} />
          <Socket x={32} />
        </G>
      );

    case 'hallway':
      return (
        <G>
          {/* front door */}
          {R(12, 16, 52, 72, c.unitDark, 3)}
          {R(17, 21, 42, 26, c.glass, 2)}
          {R(17, 52, 42, 32, c.unit, 2)}
          <Circle cx={56} cy={61} r={2.6} fill={c.metal} />
          {/* coat hooks */}
          {R(96, 28, 70, 5, c.unit, 2)}
          {[0, 1, 2, 3].map((i) => (
            <Circle key={i} cx={106 + i * 17} cy={36} r={2.6} fill={c.metal} />
          ))}
          <Skirting />
        </G>
      );

    case 'laundry':
      return (
        <G>
          {R(14, 48, 46, 40, c.porcelain, 4)}
          <Circle cx={37} cy={69} r={12} fill={c.glass} />
          <Circle cx={37} cy={69} r={12} fill="none" stroke={c.porcelainEdge} strokeWidth={2.5} />
          {R(18, 52, 24, 5, c.porcelainEdge, 2)}
          {R(70, 48, 44, 40, c.porcelain, 4)}
          <Circle cx={92} cy={69} r={12} fill={c.glass} />
          <Circle cx={92} cy={69} r={12} fill="none" stroke={c.porcelainEdge} strokeWidth={2.5} />
          {R(128, 24, 60, 6, c.unit, 2)}
          {R(134, 13, 12, 11, c.soft, 2)}
          {R(150, 15, 10, 9, c.glass, 2)}
          <Skirting />
        </G>
      );

    case 'garage':
    case 'storage':
      return (
        <G>
          {R(10, 20, 74, 68, c.unit, 2)}
          {[0, 1, 2].map((i) => (
            <Rect key={i} x={10} y={40 + i * 17} width={74} height={4} rx={1} fill={c.edge} />
          ))}
          {R(16, 27, 14, 13, c.soft, 1)}
          {R(34, 29, 12, 11, c.glass, 1)}
          {R(18, 47, 16, 13, c.soft, 1)}
          {R(52, 45, 18, 15, c.soft, 1)}
          {R(20, 64, 20, 15, c.soft, 1)}
          {R(120, 16, 74, 36, '#00000010', 2)}
          {[0, 1, 2, 3].map((i) => (
            <Rect key={i} x={120} y={21 + i * 8} width={74} height={2} fill="#00000012" />
          ))}
          <Skirting />
        </G>
      );

    case 'balcony':
      return (
        <G>
          <Rect x={0} y={0} width={200} height={FLOOR} fill="#DCEAF0" />
          <Circle cx={40} cy={22} r={14} fill="#FFFFFF70" />
          <Circle cx={56} cy={26} r={11} fill="#FFFFFF70" />
          <Circle cx={150} cy={17} r={12} fill="#FFFFFF60" />
          <Rect x={0} y={64} width={200} height={24} fill="#00000008" />
          {R(0, 61, 200, 5, c.unitDark, 1)}
          {Array.from({ length: 14 }).map((_, i) => (
            <Rect key={i} x={6 + i * 14} y={65} width={3} height={23} rx={1} fill={c.unitDark} />
          ))}
        </G>
      );

    default:
      return (
        <G>
          <Skirting />
          <Socket x={22} />
        </G>
      );
  }
}
