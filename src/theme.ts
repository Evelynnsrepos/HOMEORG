/**
 * Homeorg<3 design tokens, in a few colour schemes you pick in Settings.
 *
 * `colors` is one shared object that the active scheme is copied into, and
 * every screen reads it while it draws — so switching scheme is: copy the new
 * palette in, then redraw the app (the root layout remounts on the change).
 * Don't copy a colour into a module-level constant; read `colors.x` at render.
 *
 * The token names are older than the schemes: `coral` is the main accent (the
 * pink in Kawaii), `sage` is "done". No scheme has an alarm red for overdue
 * work — the worst a room gets is a warm peach.
 */

export type ThemeId = 'kawaii' | 'classic' | 'dracula' | 'matcha' | 'lavender' | 'midnight';

export interface Palette {
  bg: string;
  bgDeep: string;
  card: string;
  cardAlt: string;
  line: string;
  lineSoft: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  onDark: string;
  coral: string;
  coralDeep: string;
  coralSoft: string;
  sage: string;
  sageDeep: string;
  sageSoft: string;
  gold: string;
  goldSoft: string;
  goldDeep: string;
  ember: string;
  sparkling: string;
  noRush: string;
  needsLove: string;
  needsYou: string;
  lilac: string;
  lilacSoft: string;
  lilacDeep: string;
  plum: string;
  espresso: string;
  night: string;
  shadow: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  blurb: string;
  /** dark background: light status bar, and decorations adapt */
  dark: boolean;
  /** vines, bulbs and stickers */
  decor: boolean;
  palette: Palette;
}

export const themes: Theme[] = [
  {
    id: 'kawaii',
    name: 'Kawaii',
    blurb: 'Blush pink, ivy and fairy lights',
    dark: false,
    decor: true,
    palette: {
      bg: '#FFF3F7',
      bgDeep: '#FCE3EE',
      card: '#FFFFFF',
      cardAlt: '#FFEFF5',
      line: '#F5D3E2',
      lineSoft: '#FAE3EC',
      ink: '#3D2836',
      inkSoft: '#6E5066',
      inkMuted: '#A9879B',
      onDark: '#FFF6FA',
      coral: '#FF79B0',
      coralDeep: '#E2508F',
      coralSoft: '#FFD8E8',
      sage: '#6FCDA8',
      sageDeep: '#2F9C77',
      sageSoft: '#D6F4E8',
      gold: '#FFC24D',
      goldSoft: '#FFF0C8',
      goldDeep: '#A2701A',
      ember: '#FF5F8F',
      sparkling: '#5FC79C',
      noRush: '#A8D46F',
      needsLove: '#FFAA5E',
      needsYou: '#FF8BA0',
      lilac: '#B48CF0',
      lilacSoft: '#EFE3FF',
      lilacDeep: '#7A4FC4',
      plum: '#7D2470',
      espresso: '#4A2F43',
      night: '#2A1A26',
      shadow: '#D2588F',
    },
  },
  {
    id: 'classic',
    name: 'Classic',
    blurb: 'The original: cream paper, sage and coral',
    dark: false,
    decor: false,
    palette: {
      bg: '#FAF5EA',
      bgDeep: '#F3EADA',
      card: '#FFFCF5',
      cardAlt: '#F6EFE1',
      line: '#E7DECB',
      lineSoft: '#EFE7D7',
      ink: '#2E2A25',
      inkSoft: '#5B544A',
      inkMuted: '#9A9083',
      onDark: '#FBF6EC',
      coral: '#EE8A6C',
      coralDeep: '#DC7154',
      coralSoft: '#FBDCD1',
      sage: '#7FA88A',
      sageDeep: '#5F8A6C',
      sageSoft: '#DDEBE0',
      gold: '#E3AE45',
      goldSoft: '#F8E9C8',
      goldDeep: '#8A6B1F',
      ember: '#E2664A',
      sparkling: '#7FA88A',
      noRush: '#A9BE86',
      needsLove: '#E0A458',
      needsYou: '#CF8368',
      lilac: '#A78BC4',
      lilacSoft: '#ECE3F5',
      lilacDeep: '#6E5294',
      plum: '#6B4A7A',
      espresso: '#4A403A',
      night: '#241F1B',
      shadow: '#8A7A5C',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    blurb: 'Dark, with pink, purple and neon green',
    dark: true,
    decor: true,
    palette: {
      bg: '#282A36',
      bgDeep: '#21222C',
      card: '#343746',
      cardAlt: '#3C3F52',
      line: '#4D5168',
      lineSoft: '#424559',
      ink: '#F8F8F2',
      inkSoft: '#D6D6E0',
      inkMuted: '#9AA2C8',
      onDark: '#F8F8F2',
      coral: '#FF79C6',
      coralDeep: '#FF92D0',
      coralSoft: '#4A3550',
      sage: '#3DBE6A',
      sageDeep: '#69FF94',
      sageSoft: '#2E4A3A',
      gold: '#F1FA8C',
      goldSoft: '#45462F',
      goldDeep: '#F1FA8C',
      ember: '#FF5555',
      sparkling: '#50FA7B',
      noRush: '#8BE9FD',
      needsLove: '#FFB86C',
      needsYou: '#FF6E6E',
      lilac: '#BD93F9',
      lilacSoft: '#3E3656',
      lilacDeep: '#D6BCFF',
      plum: '#BD93F9',
      espresso: '#44475A',
      night: '#191A21',
      shadow: '#000000',
    },
  },
  {
    id: 'matcha',
    name: 'Matcha',
    blurb: 'Soft greens and warm paper',
    dark: false,
    decor: true,
    palette: {
      bg: '#F3F6EC',
      bgDeep: '#E6EDD9',
      card: '#FFFFFB',
      cardAlt: '#EDF2E2',
      line: '#D6E0C4',
      lineSoft: '#E3EAD5',
      ink: '#26301F',
      inkSoft: '#4E5A44',
      inkMuted: '#8A957E',
      onDark: '#F6FAEF',
      coral: '#7DA453',
      coralDeep: '#56782F',
      coralSoft: '#DCEBC8',
      sage: '#5FA98A',
      sageDeep: '#3E7F64',
      sageSoft: '#D4EDE2',
      gold: '#E2B34A',
      goldSoft: '#F6EBC9',
      goldDeep: '#7E621B',
      ember: '#D9774E',
      sparkling: '#6FA35A',
      noRush: '#A8BF6A',
      needsLove: '#E0A458',
      needsYou: '#CF8368',
      lilac: '#A99BD1',
      lilacSoft: '#EAE6F5',
      lilacDeep: '#5E5094',
      plum: '#5E5094',
      espresso: '#3A4231',
      night: '#1E241A',
      shadow: '#6E7F55',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    blurb: 'Lilac clouds with a pink blush',
    dark: false,
    decor: true,
    palette: {
      bg: '#F6F3FC',
      bgDeep: '#ECE6F8',
      card: '#FFFFFF',
      cardAlt: '#F1ECFA',
      line: '#DDD3F0',
      lineSoft: '#E8E1F6',
      ink: '#2E2840',
      inkSoft: '#5A5170',
      inkMuted: '#9990B0',
      onDark: '#FAF8FF',
      coral: '#9B7BEA',
      coralDeep: '#7454CF',
      coralSoft: '#E4DAFB',
      sage: '#6CC4B4',
      sageDeep: '#2E8C7C',
      sageSoft: '#D5F0EA',
      gold: '#F2B95A',
      goldSoft: '#FBEED3',
      goldDeep: '#8C6516',
      ember: '#E86F9A',
      sparkling: '#6CC4B4',
      noRush: '#A4C97A',
      needsLove: '#F2A766',
      needsYou: '#E88BA8',
      lilac: '#F48FC4',
      lilacSoft: '#FCE3F0',
      lilacDeep: '#B4407F',
      plum: '#5B3A9E',
      espresso: '#3D3456',
      night: '#1F1A2E',
      shadow: '#7B62C4',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    blurb: 'Deep blue night with soft glows',
    dark: true,
    decor: true,
    palette: {
      bg: '#0F1626',
      bgDeep: '#0B111E',
      card: '#18223A',
      cardAlt: '#1F2B47',
      line: '#2C3A5C',
      lineSoft: '#24304D',
      ink: '#EEF2FB',
      inkSoft: '#C3CCE0',
      inkMuted: '#8794B3',
      onDark: '#EEF2FB',
      coral: '#5AA9FF',
      coralDeep: '#8CC4FF',
      coralSoft: '#1F3456',
      sage: '#2FAE86',
      sageDeep: '#6FE3BE',
      sageSoft: '#173D37',
      gold: '#FFCF5C',
      goldSoft: '#3A3423',
      goldDeep: '#FFDB85',
      ember: '#FF7A7A',
      sparkling: '#3CC79B',
      noRush: '#8FD16A',
      needsLove: '#FFB25C',
      needsYou: '#FF8A8A',
      lilac: '#A68CFF',
      lilacSoft: '#2B2752',
      lilacDeep: '#C7B8FF',
      plum: '#A68CFF',
      espresso: '#24304D',
      night: '#070B14',
      shadow: '#000000',
    },
  },
];

export const DEFAULT_THEME: ThemeId = 'kawaii';

let active: Theme = themes[0];

/** The palette of the active scheme. Mutated in place by applyTheme. */
export const colors: Palette = { ...active.palette };

export function currentTheme(): Theme {
  return active;
}

export function themeById(id?: string): Theme {
  return themes.find((t) => t.id === id) ?? themes.find((t) => t.id === DEFAULT_THEME)!;
}

/** Where to go back to after the redraw a scheme change causes. */
export const themeReturn: { route: string | null } = { route: null };

/** Copy a scheme into `colors`. The caller redraws (see app/_layout.tsx). */
export function applyTheme(id?: string) {
  active = themeById(id);
  Object.assign(colors, active.palette);
}

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
    get shadowColor() {
      return colors.shadow;
    },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lift: {
    get shadowColor() {
      return colors.shadow;
    },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
};

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

/** Getters, so the colours follow the active scheme. */
export const bandColor: Record<CleanBand, string> = {
  get sparkling() {
    return colors.sparkling;
  },
  get noRush() {
    return colors.noRush;
  },
  get needsLove() {
    return colors.needsLove;
  },
  get needsYou() {
    return colors.needsYou;
  },
};
