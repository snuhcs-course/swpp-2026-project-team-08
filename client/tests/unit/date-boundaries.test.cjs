// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// Target: date validation and calendar rules. No mocks.
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { validDate } = require('../../src/util/date.ts');
const { calendarCells, shiftMonth } = require('../../src/features/meal-log/rules.ts');

for (const date of ['1900-01-01', '2200-12-31', '2000-02-29', '2024-02-29', '2026-04-30', '2026-12-31']) {
  test(`accepts valid date ${date}`, () => assert.equal(validDate(date), true));
}
for (const date of ['1899-12-31', '2201-01-01', '1900-02-29', '2100-02-29', '2026-02-29', '2026-04-31', '2026-00-01', '2026-13-01', '2026-01-00', '2026-01-32', '2026-1-01', '', null, 20261023]) {
  test(`rejects invalid date ${JSON.stringify(date)}`, () => assert.equal(validDate(date), false));
}
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
