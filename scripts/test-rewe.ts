/**
 * Checks the REWE order import against three real orders: npm run test:rewe
 *
 * The fixtures hold the article table of each order as positioned text, with
 * the personal header (name, email, customer number, address) left out. Each
 * one is written back into a small PDF the same way REWE's generator does it —
 * Helvetica, WinAnsi, Flate-compressed pages, one Tm/Tj per piece of text — so
 * the run goes through the real reader, not just the parser.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

import { readReweOrder, sameThing } from '../src/lib/orderImport';
import { NotAReweOrder } from '../src/lib/rewe';

interface Run {
  p: number;
  x: number;
  y: number;
  s: number;
  t: string;
}

const WIN_ANSI: Record<string, number> = { '€': 0x80, '„': 0x84, '–': 0x96, '—': 0x97, '“': 0x93, '”': 0x94 };

function encode(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = WIN_ANSI[ch] ?? ch.charCodeAt(0);
    if (ch === '(' || ch === ')' || ch === '\\') out += `\\${ch}`;
    else if (code > 126) out += `\\${code.toString(8).padStart(3, '0')}`;
    else out += ch;
  }
  return out;
}

function buildPdf(runs: Run[]): Uint8Array {
  const pages = Math.max(...runs.map((r) => r.p)) + 1;
  const objects: Buffer[] = [];
  const add = (body: Buffer | string) => objects.push(Buffer.isBuffer(body) ? body : Buffer.from(body, 'latin1'));

  add('<</Type/Catalog/Pages 2 0 R>>');
  const kids = Array.from({ length: pages }, (_, i) => `${4 + i * 2} 0 R`).join(' ');
  add(`<</Type/Pages/Count ${pages}/Kids[${kids}]>>`);
  add('<</Subtype/Type1/Type/Font/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>');

  for (let p = 0; p < pages; p++) {
    const content = runs
      .filter((r) => r.p === p)
      .map((r) => `BT\n/F1 ${r.s} Tf\n1 0 0 1 ${r.x} ${r.y} Tm\n(${encode(r.t)})Tj\nET`)
      .join('\n');
    const stream = deflateSync(Buffer.from(content, 'latin1'));
    add(`<</Contents ${5 + p * 2} 0 R/Type/Page/Resources<</Font<</F1 3 0 R>>>>/Parent 2 0 R/MediaBox[0 0 595.28 841.88]>>`);
    add(Buffer.concat([Buffer.from(`<</Filter/FlateDecode/Length ${stream.length}>>stream\n`), stream, Buffer.from('\nendstream')]));
  }

  const parts = [Buffer.from('%PDF-2.0\n')];
  objects.forEach((body, i) => parts.push(Buffer.from(`${i + 1} 0 obj\n`), body, Buffer.from('\nendobj\n')));
  parts.push(Buffer.from('trailer\n<</Root 1 0 R>>\n%%EOF\n'));
  return new Uint8Array(Buffer.concat(parts));
}

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

const dir = join(__dirname, 'fixtures');
for (const file of readdirSync(dir).filter((f) => f.startsWith('rewe-'))) {
  const { runs, expect } = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  check(file, () => {
    const plan = readReweOrder(buildPdf(runs));
    assert.equal(plan.orderNo, expect.orderNo);
    assert.equal(plan.date, expect.date);
    assert.deepEqual(
      plan.drafts.map(
        (d) => `${d.place} | ${d.name} | ${d.qty} ${d.unit}${d.keep ? '' : ' | off'}${d.changed ? ' | ' + d.changed : ''}`,
      ),
      expect.drafts,
    );
    assert.deepEqual(
      plan.skipped.map((s) => `${s.why} | ${s.name}`),
      expect.skipped,
    );
  });
}

check('anything else is not a REWE order', () => {
  const other = buildPdf([{ p: 0, x: 60, y: 700, s: 10, t: 'Stromrechnung Oktober' }]);
  assert.throws(() => readReweOrder(other), NotAReweOrder);
  assert.throws(() => readReweOrder(new TextEncoder().encode('not a pdf at all')), NotAReweOrder);
});

check('shopping list matches what came home', () => {
  assert.ok(sameThing('Zwiebeln', 'Erlenhof Gemüsezwiebeln 750g im Netz'));
  assert.ok(sameThing('Zwiebel', 'Zwiebel rot'));
  assert.ok(sameThing('Mozzarella', 'Mozzarella 125g'));
  assert.ok(sameThing('Eier', 'Endres Eier Bodenhaltung 6 Stück'));
  assert.ok(!sameThing('Eier', 'Bernbacher Eiernudeln Spaghetti 250g'));
  assert.ok(!sameThing('Milch', 'Hirtenkäse 250g'));
});

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
