/**
 * Checks the check-in logic: npm run test:mood
 */
import assert from 'node:assert/strict';

import { PRESETS, affirmationsFor, heatmapGrid, isHardDay, nearestPreset, suggestionsFor } from '../src/lib/mood';

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

const preset = (id: string) => PRESETS.find((p) => p.id === id)!.values;

check('low and rough are hard days, okay is not', () => {
  assert.ok(isHardDay({ ...preset('rough'), preset: 'rough' }));
  assert.ok(isHardDay({ ...preset('low') }));
  assert.ok(!isHardDay({ ...preset('okay'), preset: 'okay' }));
  // a fine mood but nothing left of anything else still deserves care
  assert.ok(isHardDay({ mood: 45, social: 10, clean: 10, hobby: 10 }));
});

check('three different kind lines, the same all day', () => {
  const a = affirmationsFor(preset('rough'), '2026-10-23');
  assert.equal(a.length, 3);
  assert.equal(new Set(a).size, 3);
  assert.deepEqual(a, affirmationsFor(preset('rough'), '2026-10-23'));
});

check('suggestions always mean less to do', () => {
  assert.deepEqual(suggestionsFor(preset('rough')), ['rest', 'quiet', 'cosy']);
  assert.deepEqual(suggestionsFor(preset('meh')), ['tiny', 'cosy']);
});

check('sliders get the face that fits', () => {
  assert.equal(nearestPreset({ mood: 88, social: 70, clean: 90, hobby: 80 }).id, 'great');
  assert.equal(nearestPreset({ mood: 20, social: 40, clean: 10, hobby: 20 }).id, 'low');
});

check('heatmap: Monday to Sunday columns ending this week, no future days', () => {
  const g = heatmapGrid(4, new Date('2026-10-23T09:00:00'));
  assert.equal(g.length, 4);
  assert.equal(g[3][0], '2026-10-19'); // Monday of this week
  assert.equal(g[3][4], '2026-10-23');
  assert.equal(g[3][5], null);
  assert.equal(g[0][0], '2026-09-28');
});

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
