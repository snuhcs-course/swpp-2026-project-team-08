// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 달력 날짜 선택과 최소·최대 월 이동 제한 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { act, renderHook } = require('../helpers/react-harness.cjs');
const { mockModules } = require('../helpers/mock-modules.cjs');

const list = { data: [], isPending: false, isError: false, isFetching: false, refetch: async () => {} };
const draft = { data: null, refetch: async () => {} };
mockModules(name => {
  if (name.endsWith('/data/queries/mealLogQueries')) return { useMealList: () => list };
  if (name.endsWith('/data/queries/mealQueries')) return { useMealDraft: () => draft };
  return undefined;
});
const { useMealLog } = require('../../src/features/meal-log/hooks/useMealLog.ts');

test('calendar defaults to today and rejects future dates and month navigation', async t => {
  const { localDate } = require('../../src/util/date.ts');
  const now = new Date(2026, 10, 3, 12);
  t.mock.timers.enable({ apis: ['Date'], now: now.getTime() });
  const future = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  const hook = await renderHook(t, () => useMealLog('1'));
  assert.equal(hook.current.selectedDate, localDate(now));
  assert.equal(hook.current.year, now.getFullYear());
  assert.equal(hook.current.month, now.getMonth());
  await act(async () => {
    hook.current.goMonth(1);
    hook.current.setMonthYear(future.getFullYear(), future.getMonth());
    hook.current.toggleDate(localDate(future));
  });
  assert.equal(hook.current.selectedDate, localDate(now));
  assert.equal(hook.current.year, now.getFullYear());
  assert.equal(hook.current.month, now.getMonth());
  await act(async () => hook.current.goMonth(-1));
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  assert.equal(hook.current.year, previous.getFullYear());
  assert.equal(hook.current.month, previous.getMonth());
});

test('calendar stops at January 1900 and still allows moving forward', async t => {
  const hook = await renderHook(t, () => useMealLog('1', '1900-01-01'));
  await act(async () => hook.current.goMonth(-1));
  assert.equal(hook.current.year, 1900);
  assert.equal(hook.current.month, 0);
  await act(async () => hook.current.setMonthYear(1899, 11));
  assert.equal(hook.current.year, 1900);
  assert.equal(hook.current.month, 0);
  await act(async () => hook.current.goMonth(1));
  assert.equal(hook.current.year, 1900);
  assert.equal(hook.current.month, 1);
});
