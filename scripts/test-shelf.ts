/**
 * Checks the best-before lookup: npm run test:shelf
 *
 * Names are the ones that come off real REWE orders and eBons, where the
 * order of the rules matters — tuna in oil is a tin, not fish; vegan mince
 * is not mince; peanut butter is not butter.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
  assert.equal(days('Bio erdnussbutter crunchy', 'pantry'), 180);
  assert.equal(days('Apfelgetränk pfirsich', 'pantry'), 365);
  // the thing is at the end of a German compound
  assert.equal(days('Fischsauce', 'pantry'), 730);
  assert.equal(days('Tamarindenpaste', 'fridge'), 180);
  assert.equal(days('Knoblauch', 'pantry'), 60);
  assert.equal(days('Zuckerschoten', 'fridge'), 5);
  assert.equal(days('coconut milk', 'pantry'), 365);
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
  assert.equal(autoBestBefore('Eier', 'fridge', '2026-10-01T09:00:00'), '2026-10-29');
});

check('FoodKeeper fills in English names the table does not know', () => {
  assert.equal(shelfLife('venison', 'fridge').source, 'foodkeeper');
  assert.equal(shelfLife('scallops', 'fridge').days, 1);
  assert.equal(shelfLife('caviar', 'fridge').source, 'foodkeeper');
  // the table still answers first, so German names keep their tested numbers
  assert.equal(shelfLife('Milch', 'fridge').source, 'table');
  assert.equal(days('beef jerky', 'pantry'), 365);
  assert.notEqual(days('kombucha', 'fridge'), 365);
});

check('hints from a barcode lookup help a name nobody knows', () => {
  assert.equal(shelfLife('배추김치', 'fridge').known, false);
  assert.equal(shelfLife('배추김치', 'fridge', ['en:kimchi', 'en:fermented-foods']).days, 90);
});

check('ingredients from many kitchens land in a sensible range', () => {
  const { items } = JSON.parse(readFileSync(join(__dirname, 'fixtures', 'shelf-life.json'), 'utf8')) as {
    items: { name: string; place: Place; min?: number; max?: number; keeps?: boolean }[];
  };
  const off = items.filter((it) => {
    const r = shelfLife(it.name, it.place);
    return it.keeps ? r.days !== null : r.days === null || r.days < it.min! || r.days > it.max!;
  });
  assert.deepEqual(
    off.map((it) => `${it.name} (${it.place}): ${shelfLife(it.name, it.place).days}`),
    [],
    `${off.length} of ${items.length} outside their range`,
  );
});

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
