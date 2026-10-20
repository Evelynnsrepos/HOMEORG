export interface AchievementDef {
  id: string;
  name: string;
  hint: string;
  emoji: string;
  /** 0..1 — how far along you are */
  progress: (s: AchievementInput) => number;
}

export interface AchievementInput {
  completions: number;
  streak: number;
  longestStreak: number;
  minutes: number;
  coins: number;
  itemsOwned: number;
  roomsSparkling: number;
  rooms: number;
  deepDone: number;
  focusDone: number;
  sprintsDone: number;
  challengesDone: number;
  underTenMinutes: number;
  earlyBird: number;
  nightOwl: number;
  perfectDays: number;
}

const pct = (n: number, target: number) => Math.max(0, Math.min(1, n / target));

export const achievements: AchievementDef[] = [
  {
    id: 'first',
    name: 'First tick',
    hint: 'Finish a single chore',
    emoji: '\u{2705}',
    progress: (s) => pct(s.completions, 1),
  },
  {
    id: 'ten',
    name: 'Getting going',
    hint: 'Ten chores done',
    emoji: '\u{1F331}',
    progress: (s) => pct(s.completions, 10),
  },
  {
    id: 'hundred',
    name: 'A hundred jobs',
    hint: 'One hundred chores done',
    emoji: '\u{1F3C5}',
    progress: (s) => pct(s.completions, 100),
  },
  {
    id: 'streak3',
    name: 'Three in a row',
    hint: 'A three day streak',
    emoji: '\u{1F525}',
    progress: (s) => pct(s.longestStreak, 3),
  },
  {
    id: 'streak14',
    name: 'Fortnight',
    hint: 'A fourteen day streak',
    emoji: '\u{1F31F}',
    progress: (s) => pct(s.longestStreak, 14),
  },
  {
    id: 'hour',
    name: 'An hour in',
    hint: 'Sixty minutes cleaned',
    emoji: '\u{23F1}\u{FE0F}',
    progress: (s) => pct(s.minutes, 60),
  },
  {
    id: 'tenhours',
    name: 'Ten hours deep',
    hint: 'Six hundred minutes cleaned',
    emoji: '\u{231B}',
    progress: (s) => pct(s.minutes, 600),
  },
  {
    id: 'deep5',
    name: 'Not afraid of the oven',
    hint: 'Five deep-clean jobs',
    emoji: '\u{1F9F4}',
    progress: (s) => pct(s.deepDone, 5),
  },
  {
    id: 'focus10',
    name: 'One thing at a time',
    hint: 'Ten tasks finished in Focus mode',
    emoji: '\u{1F3AF}',
    progress: (s) => pct(s.focusDone, 10),
  },
  {
    id: 'quick',
    name: 'Under ten minutes',
    hint: 'Finish five tasks in under ten minutes each, in Focus',
    emoji: '\u{26A1}',
    progress: (s) => pct(s.underTenMinutes, 5),
  },
  {
    id: 'sprint3',
    name: 'Sprinter',
    hint: 'Finish three sprints',
    emoji: '\u{1F3C3}',
    progress: (s) => pct(s.sprintsDone, 3),
  },
  {
    id: 'challenge',
    name: 'Checklist finisher',
    hint: 'Complete a challenge',
    emoji: '\u{1F3C6}',
    progress: (s) => pct(s.challengesDone, 1),
  },
  {
    id: 'shopper',
    name: 'Interior decorator',
    hint: 'Own ten pieces of furniture',
    emoji: '\u{1FA91}',
    progress: (s) => pct(s.itemsOwned, 10),
  },
  {
    id: 'rich',
    name: 'Coin hoarder',
    hint: 'Hold five hundred coins at once',
    emoji: '\u{1FA99}',
    progress: (s) => pct(s.coins, 500),
  },
  {
    id: 'sparkle',
    name: 'The whole house glows',
    hint: 'Every room over 80%',
    emoji: '\u{2728}',
    progress: (s) => (s.rooms === 0 ? 0 : pct(s.roomsSparkling, s.rooms)),
  },
  {
    id: 'early',
    name: 'Early bird',
    hint: 'Five chores before 8am',
    emoji: '\u{1F413}',
    progress: (s) => pct(s.earlyBird, 5),
  },
  {
    id: 'night',
    name: 'Night owl',
    hint: 'Five chores after 10pm',
    emoji: '\u{1F989}',
    progress: (s) => pct(s.nightOwl, 5),
  },
  {
    id: 'clear',
    name: 'Big day',
    hint: 'Five chores in a single day, three times over',
    emoji: '\u{1F3C1}',
    progress: (s) => pct(s.perfectDays, 3),
  },
];
