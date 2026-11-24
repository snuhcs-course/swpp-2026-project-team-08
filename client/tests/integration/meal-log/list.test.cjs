// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// Connects useMealLog → real Query → API/DTO and draft storage. Only HTTP/native boundaries are mocked.
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 서버에서 읽은 음식·재료의 어려움 태그 세부 항목 유지 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 식사 기록 목록 조회·검색·실패 검증을 기능 폴더로 이동
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries();
const { mealResponse } = require('../../fixtures/server-meal.cjs');
const { useMealLog } = require('../../../src/features/meal-log/hooks/useMealLog.ts');
beforeEach(() => values.clear());
function mockList(t, response) {
  t.mock.method(global, 'fetch', async url => {
    assert.equal(new URL(url).pathname, '/api/v1/meals');
    return response();
  });
}
const json = data => new Response(JSON.stringify(data));

test('날짜를 해제하고 음식 이름 검색을 제출하면 해당 식사만 표시되며 검색어를 비우면 전체 목록이 복원된다', async t => {
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

test('식사 목록 조회 실패 후 재시도에 성공하면 오류가 사라지고 식사 목록이 표시된다', async t => {
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

test('다른 계정의 식사가 응답에 포함되면 조회 오류로 처리하고 목록에 표시하지 않는다', async t => {
  mockList(t, () => json([{ ...mealResponse(), user_id: '2' }]));
  const hook = await renderHook(t, () => useMealLog('1', '2026-10-23'));
  await waitFor(() => hook.current.error);
  assert.deepEqual(hook.current.meals, []);
  assert.equal(hook.current.hasMeals, false);
});

test('식사 목록이 비어 있는 응답은 오류 없이 기록 없음 상태로 표시된다', async t => {
  mockList(t, () => json([]));
  const hook = await renderHook(t, () => useMealLog('1', '2026-10-23'));
  await waitFor(() => !hook.current.loading);
  assert.equal(hook.current.error, false);
  assert.equal(hook.current.hasMeals, false);
  assert.deepEqual(hook.current.counts, {});
});

test('식사 기록을 조회하면 서버의 음식·재료별 어려움 분류와 Texture 세부 항목을 유지한다', async t => {
  const meal = mealResponse();
  meal.foods[0].outcome = 'TASTED';
  meal.foods[0].difficulty_reasons = ['TEXTURE.HARDNESS.FIRM', 'TASTE.SWEET'];
  meal.foods[0].ingredients = [{ id: '2', name: 'Egg', outcome: 'UNTOUCHED',
    difficulty_reasons: ['TEXTURE.SURFACE.ROUGH', 'COLOR.YELLOW'] }];
  mockList(t, () => json([meal]));
  const hook = await renderHook(t, () => useMealLog('1', '2026-10-23'));
  await waitFor(() => !hook.current.loading);
  assert.equal(hook.current.error, false);
  const { foodResponseCardsFromDetail } = require('../../../src/features/meal-log/rules.ts');
  const cards = foodResponseCardsFromDetail(hook.current.meals[0]);
  assert.deepEqual(cards[0].reasons, [
    { category: 'texture', subcategory: 'hardness', value: 'firm' },
    { category: 'tasteType', subcategory: null, value: 'sweet' },
  ]);
  assert.deepEqual(cards[1].reasons, [
    { category: 'texture', subcategory: 'surface', value: 'rough' },
    { category: 'color', subcategory: null, value: 'yellow' },
  ]);
});
