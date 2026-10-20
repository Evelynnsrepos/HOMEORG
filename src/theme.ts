/**
 * Tidywell design tokens.
 * Warm cream paper, sage greens, coral accents. Nothing red for "you failed" —
 * the palette deliberately has no alarm colour for overdue work.
 */

export const colors = {
  // Paper
  bg: '#FAF5EA',
  bgDeep: '#F3EADA',
  card: '#FFFCF5',
  cardAlt: '#F6EFE1',
  line: '#E7DECB',
  lineSoft: '#EFE7D7',

  // Ink
  ink: '#2E2A25',
  inkSoft: '#5B544A',
  inkMuted: '#9A9083',
  onDark: '#FBF6EC',

  // Brand
  coral: '#EE8A6C',
  coralDeep: '#DC7154',
  coralSoft: '#FBDCD1',
  sage: '#7FA88A',
  sageDeep: '#5F8A6C',
  sageSoft: '#DDEBE0',
  gold: '#E3AE45',
  goldSoft: '#F8E9C8',
  ember: '#E2664A',

  // Cleanliness scale (never alarming)
  sparkling: '#7FA88A',
  noRush: '#A9BE86',
  needsLove: '#E0A458',
  needsYou: '#CF8368',

  espresso: '#4A403A',
  night: '#241F1B',
} as const;

/** Accent colours rooms cycle through. */
export const roomPalette = [
  '#7FA88A', // sage
  '#A78BC4', // lilac
  '#E0A458', // amber
  '#C4676B', // berry
  '#7FA8C4', // sky
  '#D98BA8', // rose
  '#8FA05E', // olive
  '#C98A5E', // clay
];

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;

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
    shadowColor: '#8A7A5C',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lift: {
    shadowColor: '#8A7A5C',
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
