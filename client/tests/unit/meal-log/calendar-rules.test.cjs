// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// Target: date validation and calendar rules. No mocks.
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 공통 날짜 검증과 History 달력 규칙 분리
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

const { validDate } = require('../../../src/util/date.ts');

const { calendarCells, shiftMonth } = require('../../../src/features/meal-log/rules.ts');

for (const [year, month, days] of [[2024, 1, 29], [2026, 1, 28], [2026, 3, 30], [2026, 0, 31]]) {
  test(`calendar includes all ${days} days of ${year}-${month + 1} in complete weeks`, () => {
    const cells = calendarCells(year, month);
    assert.equal(cells.length % 7, 0);
    assert.deepEqual(cells.filter(cell => cell.inMonth).map(cell => cell.day), Array.from({ length: days }, (_, i) => i + 1));
    assert.equal(new Set(cells.map(cell => cell.date)).size, cells.length);
    assert.ok(cells.every(cell => validDate(cell.date)));
  });
}

for (const [month, delta, expected] of [[0, -1, { year: 2025, month: 11 }], [11, 1, { year: 2027, month: 0 }], [5, 0, { year: 2026, month: 5 }], [5, 12, { year: 2027, month: 5 }]]) {
  test(`shifts month index ${month} by ${delta} across year boundaries`, () => assert.deepEqual(shiftMonth(2026, month, delta), expected));
}
