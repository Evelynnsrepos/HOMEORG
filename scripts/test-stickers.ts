/**
 * Checks the sticker draws: npm run test:stickers
 */
import assert from 'node:assert/strict';

import { pieces, stickerSets } from '../src/data/stickerCatalog';
import { surfaceFamilies, surfaces } from '../src/data/roomSurfaces';
import { drawPiece, featuredSets, pieceById, starterPieces, starterStickers, stickersFromSlots } from '../src/lib/stickers';
import { DEFAULT_SURFACES, ROOM_SURFACES, surfaceFor } from '../src/lib/surfaces';

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
  for (let m = 0; m < Math.ceil(stickerSets.filter((s) => !s.pets).length / 3); m++) featuredSets(new Date(2026, m, 10)).forEach((s) => seen.add(s));
  assert.equal(seen.size, stickerSets.length);
  assert.notDeepEqual(featuredSets(new Date(2026, 0, 10)), featuredSets(new Date(2026, 1, 10)));
});

check('the welcome kit has two pieces from every set', () => {
  const kit = starterPieces(rng(3));
  assert.equal(kit.length, stickerSets.length * 2);
  assert.equal(new Set(kit).size, kit.length);
});

check('every room type starts with pixel pieces that exist, inside the room', () => {
  for (const type of [...Object.keys(ROOM_SURFACES), 'custom']) {
    const list = starterStickers(type, () => 'k');
    assert.ok(list.length >= 2, type);
    for (const k of list) {
      assert.equal(pieceById(k.piece)?.type, 'pixel', `${type} ${k.piece}`);
      assert.ok(k.x > 0 && k.x < 1 && k.y > 0 && k.y < 1, `${type} ${k.piece} at ${k.x},${k.y}`);
    }
  }
});

check('walls and floors: default ids exist, old ids map over, unknown ids fall back', () => {
  for (const [wall, floor] of [...Object.values(ROOM_SURFACES), DEFAULT_SURFACES]) {
    assert.equal(surfaceFor('wall', wall).id, wall);
    assert.equal(surfaceFor('floor', floor).id, floor);
  }
  assert.equal(surfaceFor('wall', 'wall_blush').kind, 'wall');
  assert.notEqual(surfaceFor('floor', 'floor_oak').id, DEFAULT_SURFACES[0]);
  assert.equal(surfaceFor('floor', 'nope').kind, 'floor');
  assert.equal(surfaceFor('floor', 'wall-painted-blush').kind, 'floor');
});

check('every wall and floor family has a blush one and a dozen or so to pick from', () => {
  assert.ok(surfaceFamilies.length >= 15);
  for (const f of surfaceFamilies) {
    const mine = surfaces.filter((s) => s.family === f.id);
    assert.ok(mine.some((s) => s.id.endsWith('-blush')), f.id);
    assert.ok(mine.length >= 3, f.id);
  }
});

check('every month has exactly one pet set, and they take turns', () => {
  const petSets = stickerSets.filter((s) => s.pets).map((s) => s.id);
  assert.ok(petSets.length >= 3);
  const seen = new Set<string>();
  for (let m = 0; m < petSets.length; m++) {
    const f = featuredSets(new Date(2026, m, 10));
    assert.equal(f.filter((id) => petSets.includes(id)).length, 1);
    f.forEach((id) => petSets.includes(id) && seen.add(id));
  }
  assert.equal(seen.size, petSets.length);
});

check('pets: manul, serval, tiger, house cats and birds are all there', () => {
  for (const id of ['pet-manul', 'pet-serval', 'pet-tiger', 'pet-cat-calico-sit', 'pet-budgie-blue', 'pet-cockatiel']) {
    assert.equal(pieceById(id)?.type, 'pixel', id);
  }
  assert.ok(pieces.filter((p) => p.kind === 'pet').length >= 50);
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
