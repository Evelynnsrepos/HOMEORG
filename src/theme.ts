/**
 * Homeorg<3 design tokens: kawaii pink.
 * Blush paper, white cards, bubblegum accents and mint for "done". Still no
 * alarm colour for overdue work — the worst a room gets is a warm peach.
 * The token names are older than the palette (coral is the pink, sage the
 * mint), so every screen picks the new colours up without a rename.
 */

export const colors = {
  // Paper
  bg: '#FFF3F7',
  bgDeep: '#FCE3EE',
  card: '#FFFFFF',
  cardAlt: '#FFEFF5',
  line: '#F5D3E2',
  lineSoft: '#FAE3EC',

  // Ink
  ink: '#3D2836',
  inkSoft: '#6E5066',
  inkMuted: '#A9879B',
  onDark: '#FFF6FA',

  // Brand
  coral: '#FF79B0',
  coralDeep: '#E2508F',
  coralSoft: '#FFD8E8',
  sage: '#6FCDA8',
  sageDeep: '#2F9C77',
  sageSoft: '#D6F4E8',
  gold: '#FFC24D',
  goldSoft: '#FFF0C8',
  ember: '#FF5F8F',

  // Cleanliness scale (never alarming)
  sparkling: '#5FC79C',
  noRush: '#A8D46F',
  needsLove: '#FFAA5E',
  needsYou: '#FF8BA0',

  // Lilac for the odd accent, the purple of the recipe book
  lilac: '#B48CF0',
  plum: '#7D2470',

  espresso: '#4A2F43',
  night: '#2A1A26',
} as const;

/** Accent colours rooms cycle through. */
export const roomPalette = [
  '#FF8FB8', // bubblegum
  '#B48CF0', // lilac
  '#6FCDA8', // mint
  '#FFB35C', // peach
  '#7FC4F0', // sky
  '#F47FD8', // orchid
  '#A8D46F', // lime
  '#FF9E8A', // coral
];

export const radius = { sm: 12, md: 18, lg: 26, xl: 32, pill: 999 } as const;

export const space = (n: number) => n * 4;

export const font = {
  display: 'Bricolage_800ExtraBold',
  bold: 'Bricolage_700Bold',
  semi: 'Bricolage_600SemiBold',
  medium: 'Bricolage_500Medium',
  body: 'Bricolage_400Regular',
} as const;

export const shadow = {
  card: {
    shadowColor: '#D2588F',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lift: {
    shadowColor: '#D2588F',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} as const;

export type CleanBand = 'sparkling' | 'noRush' | 'needsLove' | 'needsYou';

export function band(pct: number): CleanBand {
  if (pct >= 80) return 'sparkling';
  if (pct >= 50) return 'noRush';
  if (pct >= 20) return 'needsLove';
  return 'needsYou';
}

export const bandLabel: Record<CleanBand, string> = {
  sparkling: 'Sparkling',
  noRush: 'No rush',
  needsLove: 'Needs love',
  needsYou: 'Needs you',
};

export const bandColor: Record<CleanBand, string> = {
  sparkling: colors.sparkling,
  noRush: colors.noRush,
  needsLove: colors.needsLove,
  needsYou: colors.needsYou,
};
