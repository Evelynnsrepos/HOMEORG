/**
 * Checks reading a best-before out of camera text: npm run test:dates
 * Each case is what text recognition hands back for a real-world style of label.
 */
import assert from 'node:assert/strict';

import { findPrintedDate } from '../src/lib/printedDate';

const NOW = new Date('2026-10-23T12:00:00');
let failed = 0;
function check(name: string, text: string, want: string | null) {
  try {
    assert.equal(findPrintedDate(text, NOW)?.date ?? null, want);
    console.log(`ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}\n${e instanceof Error ? e.message : e}`);
  }
}

// German supermarket
check('MHD with a full date', 'Mindestens haltbar bis:\n31.12.2026\nL 4521 08:14', '2026-12-31');
check('MHD short year', 'MHD 14.11.26', '2026-11-14');
check('zu verbrauchen bis', 'Zu verbrauchen bis 02.11.2026 bei +2°C bis +7°C', '2026-11-02');
check('month and year only', 'mindestens haltbar bis Ende: 03/2027', '2027-03-31');
check('lot number and weight are not dates', 'L2610 0,450 kg 4,49 €/kg\nverbr. bis 28.10.26', '2026-10-28');

// English and Indian
check('Best before with a month name', 'BEST BEFORE 31 DEC 2026', '2026-12-31');
check('EXP year-month', 'EXP: 2027/02', '2027-02-28');
check('Indian pack with MFD and a relative best-before', 'MFD: 05/2026\nBEST BEFORE 12 MONTHS FROM MANUFACTURE', '2027-05-30');
check('Indian pack with both dates', 'PKD 12/03/2026\nUSE BY 11/03/2027', '2027-03-11');
check('the manufacture date is never the answer', 'MFG 01.10.2026\nEXP 01.04.2027', '2027-04-01');

// Turkish
check('SKT', 'ÜRT. TAR: 10.09.2026 SKT: 10.09.2027', '2027-09-10');
check('TETT with a Turkish month', 'TETT: 31 Aralık 2026', '2026-12-31');

// Japanese
check('賞味期限 with dots', '賞味期限 2026.12.31', '2026-12-31');
check('賞味期限 short year-first', '賞味期限\n26.12.31', '2026-12-31');
check('年月日', '消費期限 2026年11月3日', '2026-11-03');
check('年月 only', '賞味期限 2027年3月', '2027-03-31');
check('製造 date skipped', '製造日 2026.10.01\n賞味期限 2027.04.01', '2027-04-01');

// Taiwanese
check('Minguo year', '有效日期: 115.12.31', '2026-12-31');
check('民國 with 年月日', '有效日期 民國115年12月31日', '2026-12-31');
check('Taiwan western year', '製造日期 2026/09/01 有效日期 2027/09/01', '2027-09-01');

// Korean
check('유통기한', '유통기한 2026.12.31까지', '2026-12-31');

// what the camera gets wrong
check('O read for 0', 'MHD 31.12.2O26', '2026-12-31');
check('l read for 1', 'BEST BEFORE 3l/l2/2026', '2026-12-31');
check('the date on its own line, label above', 'TETT\n15.01.2027\nParti No: 26-114', '2027-01-15');

// nothing
check('no date at all', 'Nährwerte je 100 g\nEnergie 1520 kJ', null);
check('a date long ago is not a best-before', 'gegründet 12.05.1987', null);

if (failed) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
