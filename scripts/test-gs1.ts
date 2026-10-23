/**
 * Checks the GS1 2D code reader: npm run test:gs1
 * Example codes follow the GS1 Digital Link and General Specifications docs.
 */
import assert from 'node:assert/strict';

import { gs1Date, parseGs1 } from '../src/lib/gs1';

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

check('dates', () => {
  assert.equal(gs1Date('271231'), '2027-12-31');
  assert.equal(gs1Date('270200'), '2027-02-28'); // day 00: end of the month
  assert.equal(gs1Date('280200'), '2028-02-29');
  assert.equal(gs1Date('271332'), undefined);
  assert.equal(gs1Date('270231'), undefined);
});

check('Digital Link QR', () => {
  assert.deepEqual(parseGs1('https://id.gs1.org/01/09506000134352/10/ABC123?17=271231'), {
    gtin: '9506000134352',
    expiry: '2027-12-31',
    dateKind: 'use-by',
  });
  assert.deepEqual(parseGs1('https://example.com/gtin/04012345000016?15=270500'), {
    gtin: '4012345000016',
    expiry: '2027-05-31',
    dateKind: 'best-before',
  });
  // no date on it: still the product number
  assert.deepEqual(parseGs1('https://id.gs1.org/01/04012345000016'), { gtin: '4012345000016' });
});

check('element strings', () => {
  assert.deepEqual(parseGs1('(01)04012345000016(17)261130(10)L42'), {
    gtin: '4012345000016',
    expiry: '2026-11-30',
    dateKind: 'use-by',
  });
  // as a DataMatrix scanner hands it over: no brackets, ASCII 29 after a variable field
  assert.deepEqual(parseGs1('0104012345000016' + '10L42\u001d' + '15261100'), {
    gtin: '4012345000016',
    expiry: '2026-11-30',
    dateKind: 'best-before',
  });
  assert.deepEqual(parseGs1(']d201040123450000161726113010L42'), {
    gtin: '4012345000016',
    expiry: '2026-11-30',
    dateKind: 'use-by',
  });
  // weight on fresh meat (3103 = kg with 3 decimals) sits between the fields
  assert.equal(parseGs1('01040123450000163103000750' + '17261105')?.expiry, '2026-11-05');
});

check('everything else is not GS1', () => {
  assert.equal(parseGs1('4012345000016'), null);
  assert.equal(parseGs1('https://example.com/menu'), null);
  assert.equal(parseGs1('WIFI:S:home;T:WPA;P:secret;;'), null);
});

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
