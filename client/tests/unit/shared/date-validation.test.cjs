// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// Target: date validation and calendar rules. No mocks.
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 공통 날짜 검증과 History 달력 규칙 분리
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

const { validDate } = require('../../../src/util/date.ts');

for (const date of ['1900-01-01', '2200-12-31', '2000-02-29', '2024-02-29', '2026-04-30', '2026-12-31']) {
  test(`accepts valid date ${date}`, () => assert.equal(validDate(date), true));
}

for (const date of ['1899-12-31', '2201-01-01', '1900-02-29', '2100-02-29', '2026-02-29', '2026-04-31', '2026-00-01', '2026-13-01', '2026-01-00', '2026-01-32', '2026-1-01', '', null, 20261023]) {
  test(`rejects invalid date ${JSON.stringify(date)}`, () => assert.equal(validDate(date), false));
}
