/**
 * Checks pet care, supplies and "Don't forget this": npm run test:pets
 */
import assert from 'node:assert/strict';

import { careState, daysLeft, kindOfPreset, presetsFor, PET_KINDS } from '../src/lib/pets';
import { reminders } from '../src/lib/remind';
import type { MyPet, PantryItem, PetCare, PetSupply } from '../src/lib/types';

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

const now = new Date('2026-10-23T12:00:00');
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const mochi: MyPet = { id: 'p1', name: 'Mochi', kind: 'cat', look: 'pet-cat-calico-sit', createdAt: hoursAgo(500) };
const day = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().slice(0, 10);
const item = (id: string, name: string, place: PantryItem['place'], bestBefore?: string): PantryItem =>
  ({ id, name, qty: 1, unit: 'pc', place, bestBefore, addedAt: hoursAgo(48) }) as PantryItem;

check('every kind of pet has presets to look like, and presets know their kind', () => {
  for (const k of PET_KINDS) assert.ok(presetsFor(k.id).length > 0, k.id);
  assert.equal(kindOfPreset('pet-manul'), 'cat');
  assert.equal(kindOfPreset('pet-dog-corgi'), 'dog');
  assert.equal(kindOfPreset('pet-budgie-blue'), 'bird');
  assert.equal(kindOfPreset('pet-bunny-grey'), 'bunny');
  assert.equal(kindOfPreset('a-sofa'), 'other');
});

check('care is due when its time has passed, and fresh right after a tap', () => {
  const log: PetCare[] = [
    { id: 'c1', petId: 'p1', action: 'food', at: hoursAgo(2) },
    { id: 'c2', petId: 'p1', action: 'litter', at: hoursAgo(30) },
  ];
  const st = Object.fromEntries(careState(mochi, log, now).map((s) => [s.action.id, s]));
  assert.equal(st.food.due, false);
  assert.equal(st.litter.due, true);
  assert.equal(st.water.due, true);
  assert.equal(st.water.since, Infinity);
});

check('supplies run down by their daily use', () => {
  const food: PetSupply = { id: 's1', name: 'Cat food', kind: 'food', amount: 20, full: 24, unit: 'pouches', perDay: 2, updatedAt: hoursAgo(48) };
  assert.equal(Math.round(daysLeft(food, now)!), 8);
  assert.equal(daysLeft({ ...food, perDay: 0 }, now), null);
});

check("don't forget: tossing comes first, then using up, never nags about feeding", () => {
  const pantry = [item('a', 'Milch', 'fridge', day(-2)), item('b', 'Joghurt', 'fridge', day(2)), item('c', 'Reis', 'pantry')];
  const r = reminders({ pantry, now, petMode: true, pets: [mochi], petLog: [{ id: 'c', petId: 'p1', action: 'litter', at: hoursAgo(50) }], supplies: [] });
  assert.equal(r[0].text, 'Throw out Milch');
  assert.ok(r.some((x) => x.text === 'Use up Joghurt'));
  assert.ok(r.some((x) => x.text === 'Litter box for Mochi'));
  assert.ok(!r.some((x) => /Food|Water|Play/.test(x.text)));
});

check('an almost empty fridge asks for a restock, a new install does not', () => {
  assert.ok(reminders({ pantry: [item('c', 'Reis', 'pantry')], now }).some((x) => x.id === 'fridge-low'));
  assert.equal(reminders({ pantry: [], now }).length, 0);
});

check('pet supplies and jobs only show in pet mode', () => {
  const low: PetSupply = { id: 's', name: 'Cat litter', kind: 'litter', amount: 1, full: 10, unit: 'kg', perDay: 0.5, updatedAt: hoursAgo(1) };
  const on = reminders({ pantry: [], now, petMode: true, pets: [mochi], petLog: [], supplies: [low] });
  assert.ok(on.some((x) => x.text === 'Get more Cat litter'));
  assert.equal(reminders({ pantry: [], now, petMode: false, pets: [mochi], petLog: [], supplies: [low] }).length, 0);
});

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
