/**
 * Checks the best-before lookup: npm run test:shelf
 *
 * Names are the ones that come off real REWE orders and eBons, where the
 * order of the rules matters — tuna in oil is a tin, not fish; vegan mince
 * is not mince; peanut butter is not butter.
 */
import assert from 'node:assert/strict';

import { autoBestBefore, shelfLife } from '../src/data/shelfLife';
import type { Place } from '../src/data/units';

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

const days = (name: string, place: Place) => shelfLife(name, place).days;

check('fresh things go off soon in the fridge', () => {
  assert.equal(days('Garnelen', 'fridge'), 2);
  assert.equal(days('Rinderhack', 'fridge'), 1);
  assert.equal(days('Milch', 'fridge'), 5);
  assert.equal(days('Mozzarella 125g', 'fridge'), 5);
  assert.equal(days('Rucola', 'fridge'), 4);
});

check('the freezer buys time', () => {
  assert.ok(days('Garnelen', 'freezer')! > 60);
  assert.ok(days('Brokkoli', 'freezer')! > 100);
  assert.equal(days('Something unknown', 'freezer'), 90);
});

check('names that look like something else', () => {
  assert.equal(days('Thunfischfilet in öl', 'pantry'), 365);
  assert.equal(days('Veganes pilz-hack', 'fridge'), 7);
  assert.equal(days('Bio erdnussbutter crunchy', 'pantry'), 90);
  assert.equal(days('Apfelgetränk pfirsich', 'pantry'), 180);
  assert.equal(days('H-Milch', 'pantry'), 90);
  assert.equal(days('Kokosmilch', 'pantry'), 365);
  assert.equal(days('Lauchzwiebeln', 'fridge'), 7);
  assert.equal(days('Zwiebeln', 'pantry'), 30);
  assert.equal(days('Paprikapulver edelsüß', 'pantry'), 365);
});

check('some things keep', () => {
  assert.equal(days('Blütenhonig', 'pantry'), null);
  assert.equal(autoBestBefore('Blütenhonig', 'pantry'), undefined);
  assert.equal(days('Something unknown', 'pantry'), null);
  assert.equal(shelfLife('Something unknown', 'fridge').known, false);
});

check('dates count from when it went on the shelf', () => {
  assert.equal(autoBestBefore('Milch', 'fridge', '2026-10-20T12:00:00'), '2026-10-25');
  assert.equal(autoBestBefore('Eier', 'fridge', '2026-10-01T09:00:00'), '2026-10-22');
});

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
