/**
 * Checks the gentle streaks and the coin caps: npm run test:streak
 */
import assert from 'node:assert/strict';

import { dayKey, addDays } from '../src/lib/date';
import { allowed, type CoinEvent } from '../src/lib/rewards';
import { streakOf } from '../src/lib/streak';

let failed = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}\n${e instanceof Error ? e.message : e}`);
  }
}

const TODAY = new Date('2026-10-23T12:00:00'); // a Friday
const ago = (...n: number[]) => new Set(n.map((d) => dayKey(addDays(TODAY, -d))));

check('every day, two grace days: a few missed days do not break it', () => {
  const s = streakOf(ago(0, 2, 5, 8), { every: 1, grace: 2, weekGoal: 3 }, TODAY);
  assert.equal(s.days, 4);
  assert.equal(s.safeFor, 3);
});

check('gone longer than the grace: it starts over', () => {
  assert.equal(streakOf(ago(5, 6, 7), { every: 1, grace: 2, weekGoal: 3 }, TODAY).days, 0);
});

check('every three days is enough when that is the rhythm', () => {
  const s = streakOf(ago(1, 5, 9, 13, 17), { every: 3, grace: 1, weekGoal: 1 }, TODAY);
  assert.equal(s.days, 5);
  assert.equal(s.safeFor, 3);
});

check('a strict rhythm with no grace breaks on the first miss', () => {
  assert.equal(streakOf(ago(0, 2, 3), { every: 1, grace: 0, weekGoal: 3 }, TODAY).days, 1);
});

check('week streak: weeks that met the goal, this week once it does', () => {
  // this week (Mon 19th..): Mon and Fri; the two weeks before: three days each
  const days = ago(0, 4, 7, 8, 9, 14, 15, 16);
  const s = streakOf(days, { every: 1, grace: 2, weekGoal: 3 }, TODAY);
  assert.equal(s.thisWeek, 2);
  assert.equal(s.weeks, 2);
  assert.equal(streakOf(days, { every: 1, grace: 2, weekGoal: 2 }, TODAY).weeks, 3);
});

check('coins stop at the daily cap and start again tomorrow', () => {
  const log: CoinEvent[] = [
    { day: '2026-10-23', source: 'pantry', coins: 38 },
    { day: '2026-10-22', source: 'pantry', coins: 40 },
  ];
  assert.equal(allowed(log, 'pantry', '2026-10-23', 2), 2);
  log.push({ day: '2026-10-23', source: 'pantry', coins: 2 });
  assert.equal(allowed(log, 'pantry', '2026-10-23', 2), 0);
  assert.equal(allowed(log, 'pantry', '2026-10-24', 2), 2);
  assert.equal(allowed(log, 'chore', '2026-10-23', 500), 500);
});

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
