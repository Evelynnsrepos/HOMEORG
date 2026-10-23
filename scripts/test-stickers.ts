/**
 * Checks the sticker draws: npm run test:stickers
 */
import assert from 'node:assert/strict';

import { pieces, stickerSets } from '../src/data/stickerCatalog';
import { drawPiece, featuredSets, starterPieces, stickersFromSlots } from '../src/lib/stickers';

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

// a seeded random, so the checks don't flake
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

check('every draw is a new piece until the library is empty', () => {
  const owned = new Set<string>();
  const r = rng(1);
  for (let i = 0; i < pieces.length; i++) {
    const p = drawPiece(owned, featuredSets(new Date('2026-10-15')), r);
    assert.ok(p, `draw ${i} came back empty`);
    assert.ok(!owned.has(p!.id), `double: ${p!.id}`);
    owned.add(p!.id);
  }
  assert.equal(drawPiece(owned, featuredSets(), r), null);
});

check("this month's sets come first, each about as likely", () => {
  const featured = featuredSets(new Date('2026-10-15'));
  const owned = new Set<string>();
  const r = rng(7);
  const count: Record<string, number> = {};
  for (let i = 0; i < 60; i++) {
    const p = drawPiece(owned, featured, r)!;
    assert.ok(featured.includes(p.set));
    owned.add(p.id);
    count[p.set] = (count[p.set] ?? 0) + 1;
  }
  for (const sid of featured) assert.ok((count[sid] ?? 0) >= 10, `${sid} only ${count[sid]}`);
});

check('the sets turn over every month and each comes round', () => {
  const seen = new Set<string>();
  for (let m = 0; m < 4; m++) featuredSets(new Date(2026, m, 10)).forEach((s) => seen.add(s));
  assert.equal(seen.size, stickerSets.length);
  assert.notDeepEqual(featuredSets(new Date(2026, 0, 10)), featuredSets(new Date(2026, 1, 10)));
});

check('the welcome kit has two pieces from every set', () => {
  const kit = starterPieces(rng(3));
  assert.equal(kit.length, stickerSets.length * 2);
  assert.equal(new Set(kit).size, kit.length);
});

check('old slot furniture becomes stickers in the same places', () => {
  let n = 0;
  const out = stickersFromSlots(['art_botanical', null, null, 'sofa_sage', 'rug_sage'], () => `k${n++}`);
  assert.equal(out.length, 3);
  assert.equal(out[0].piece, 'svg:art_botanical');
  assert.ok(out[0].y < out[1].y, 'wall above floor');
  assert.equal(out.find((k) => k.piece === 'svg:rug_sage')?.z, 0);
});

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
