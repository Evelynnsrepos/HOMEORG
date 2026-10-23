/**
 * Checks the REWE import against real orders and a real eBon: npm run test:rewe
 *
 * The fixtures hold the article table of each order as positioned text, with
 * the personal header (name, email, customer number, address) left out. Each
 * one is written back into a small PDF the same way REWE's generator does it —
 * Helvetica, WinAnsi, Flate-compressed pages, one Tm/Tj per piece of text — so
 * the run goes through the real reader, not just the parser.
 */
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

import { fileKey, md5, objectKey, rc4 } from '../src/lib/crypt';
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

/**
 * An eBon as REWE's till writes it: one line of fixed-width text per Tj, an
 * embedded Type0 font whose codes only make sense through its ToUnicode map,
 * the page objects packed into an object stream, and all of it locked with
 * 40-bit RC4 and an empty user password.
 */
function buildEbonPdf(lines: string[]): Uint8Array {
  // made-up glyph ids, like a subset font's: letters only make sense via the map
  const chars = [...new Set(lines.join(''))];
  const code = new Map(chars.map((c, i) => [c, 0x100 + i * 3]));
  const hex = (n: number) => n.toString(16).toUpperCase().padStart(4, '0');
  const cmap = [
    '/CIDInit /ProcSet findresource begin 12 dict begin begincmap',
    '1 begincodespacerange <0000> <FFFF> endcodespacerange',
    `${chars.length} beginbfchar`,
    ...chars.map((c) => `<${hex(code.get(c)!)}> <${hex(c.charCodeAt(0))}>`),
    'endbfchar endcmap CMapName currentdict /CMap defineresource pop end end',
  ].join('\n');
  const content = lines
    .map((l, i) => `BT\n20 ${784.9 - i * 12} Td\n/F1 12 Tf\n<${[...l].map((c) => hex(code.get(c)!)).join('')}> Tj\nET`)
    .join('\n');

  const id = randomBytes(16);
  const o = randomBytes(32);
  const p = -1324;
  const key = fileKey(o, p, id, 3, 5);
  const lock = (num: number, data: Buffer) => Buffer.from(rc4(objectKey(key, num, 0), data));

  // 1 catalog, 2 content, 3 cmap, 4 object stream, 5 encrypt; 6-9 packed
  const packed: [number, string][] = [
    [6, '<</Type /Pages /Kids [7 0 R] /Count 1>>'],
    [7, '<</Type /Page /MediaBox [0 0 283.46 841.89] /Resources 8 0 R /Contents 2 0 R /Parent 6 0 R>>'],
    [8, '<</Font <</F1 9 0 R>> >>'],
    [9, '<</Type /Font /Subtype /Type0 /BaseFont /AADYUC+Inconsolata-Regular /Encoding /Identity-H /ToUnicode 3 0 R>>'],
  ];
  let head = '';
  let body = '';
  for (const [num, text] of packed) {
    head += `${num} ${body.length} `;
    body += text + '\n';
  }
  const objStm = deflateSync(Buffer.from(head + body, 'latin1'));
  const stream = (num: number, dict: string, data: Buffer) => {
    const locked = lock(num, deflateSync(data));
    return Buffer.concat([Buffer.from(`${num} 0 obj\n<<${dict} /Length ${locked.length} /Filter /FlateDecode>>\nstream\n`, 'latin1'), locked, Buffer.from('\nendstream\nendobj\n')]);
  };
  const objStmLocked = lock(4, objStm);
  return new Uint8Array(
    Buffer.concat([
      Buffer.from('%PDF-1.6\n1 0 obj\n<< /Type /Catalog /Version /1.6 /Pages 6 0 R >>\nendobj\n'),
      stream(2, '', Buffer.from(content, 'latin1')),
      stream(3, '', Buffer.from(cmap, 'latin1')),
      Buffer.concat([
        Buffer.from(`4 0 obj\n<< /Type /ObjStm /N ${packed.length} /First ${head.length} /Length ${objStmLocked.length} /Filter /FlateDecode >>\nstream\n`),
        objStmLocked,
        Buffer.from('\nendstream\nendobj\n'),
      ]),
      Buffer.from(`5 0 obj\n<< /Filter /Standard /V 1 /R 3 /Length 40 /P ${p} /O <${o.toString('hex')}> /U <${'00'.repeat(32)}> >>\nendobj\n`),
      Buffer.from(`trailer\n<< /Root 1 0 R /ID [<${id.toString('hex')}> <${id.toString('hex')}>] /Encrypt 5 0 R >>\n%%EOF\n`),
    ]),
  );
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

check('md5 agrees with node', () => {
  for (const n of [0, 1, 55, 56, 63, 64, 65, 200]) {
    const data = randomBytes(n);
    assert.equal(Buffer.from(md5(data)).toString('hex'), createHash('md5').update(data).digest('hex'));
  }
});

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

for (const file of readdirSync(dir).filter((f) => f.startsWith('ebon-'))) {
  const { lines, expect } = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  check(file, () => {
    const plan = readReweOrder(buildEbonPdf(lines));
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

check('till labels read like names', () => {
  const names = (lines: string[]) => readReweOrder(buildEbonPdf(['REWE Markt', 'EUR', ...lines, ' SUMME   EUR  1,00'])).drafts.map((d) => d.name);
  assert.deepEqual(
    names(['SAMBAL OELEK     1,49 B', 'SONNENB.OEL KALT     1,45 B', 'BLUMENKOHL     1,99 B', 'STEUERBERATER TEE     1,00 B']),
    ['Sambal oelek', 'Sonnenblumenöl kalt', 'Blumenkohl', 'Steuerberater tee'],
  );
});

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
