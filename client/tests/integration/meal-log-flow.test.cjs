// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// Connects useMealLog → real Query → API/DTO and draft storage. Only HTTP/native boundaries are mocked.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../helpers/react-harness.cjs');
const { values } = require('../helpers/native-boundaries.cjs').nativeBoundaries();
const { mealResponse } = require('../fixtures/server-meal.cjs');
const { useMealLog } = require('../../src/features/meal-log/hooks/useMealLog.ts');
beforeEach(() => values.clear());
function mockList(t, response) {
  t.mock.method(global, 'fetch', async url => {
    assert.equal(new URL(url).pathname, '/api/v1/meals');
    return response();
  });
}
const json = data => new Response(JSON.stringify(data));

test('loaded meals follow date selection and submitted search; clearing search restores the list', async t => {
  // Arrange: two dates and two food names, served through the real API adapter.
  const rice = mealResponse();
  const soup = { ...mealResponse(), id: '11', meal_date: '2026-10-22', foods: [{ ...rice.foods[0], meal_id: '11', name: 'Soup' }] };
  mockList(t, () => json([rice, soup]));
  const hook = await renderHook(t, () => useMealLog('1', '2026-10-23'));
  await waitFor(() => !hook.current.loading);
  assert.deepEqual(hook.current.meals.map(meal => meal.id), ['10']);
  assert.deepEqual(hook.current.counts, { '2026-10-23': 1, '2026-10-22': 1 });
  // Act: typing alone does not apply the search.
  await act(async () => { hook.current.clearDate(); hook.current.setSearch(' SOUP '); });
  assert.equal(hook.current.meals.length, 2);
  await act(async () => hook.current.submitSearch());
  // Assert: submitted search filters, and whitespace clears it.
  assert.deepEqual(hook.current.meals.map(meal => meal.id), ['11']);
  await act(async () => hook.current.setSearch(' '));
  assert.deepEqual(hook.current.meals.map(meal => meal.id), ['10', '11']);
});

test('failed list request reports an error and retry loads meals', async t => {
  let fail = true;
  mockList(t, () => fail ? new Response('{}', { status: 503 }) : json([mealResponse()]));
  const hook = await renderHook(t, () => useMealLog('1', '2026-10-23'));
  await waitFor(() => hook.current.error);
  assert.deepEqual(hook.current.meals, []);
  fail = false;
  await act(async () => hook.current.retry());
  await waitFor(() => !hook.current.error && hook.current.hasMeals);
  assert.equal(hook.current.meals[0].id, '10');
});

test('a response owned by another account is rejected instead of displayed', async t => {
  mockList(t, () => json([{ ...mealResponse(), user_id: '2' }]));
  const hook = await renderHook(t, () => useMealLog('1', '2026-10-23'));
  await waitFor(() => hook.current.error);
  assert.deepEqual(hook.current.meals, []);
  assert.equal(hook.current.hasMeals, false);
});

test('empty list is a successful empty state', async t => {
  mockList(t, () => json([]));
  const hook = await renderHook(t, () => useMealLog('1', '2026-10-23'));
  await waitFor(() => !hook.current.loading);
  assert.equal(hook.current.error, false);
  assert.equal(hook.current.hasMeals, false);
  assert.deepEqual(hook.current.counts, {});
});
