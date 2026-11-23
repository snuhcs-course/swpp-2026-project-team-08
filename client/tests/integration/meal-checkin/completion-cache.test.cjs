// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 대문자 enum·음식 id 없는 저장 요청·식사 상세 저장 응답 기준으로 수정
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 서버·기기 저장 분리 반영 및 완료 화면 흐름으로 중복 검증 이동
// AI-generated with GPT-6, 2026-11-23, reviewed by Haechan Jung
// Changed: 기기 식사 목록 쓰기 실패 후 서버 목록·상세 및 기기 초안 재조회 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { completeDraft } = require('../../fixtures/meal-checkin.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values, failNextWrite } = require('../../helpers/native-boundaries.cjs').nativeBoundaries();
const { mealResponse } = require('../../fixtures/server-meal.cjs');
const { clearSession } = require('../../../src/data/storage/authStorage.ts');
const { useSaveMeal, useMeals, useMealDraft, useMealDetail } = require('../../../src/data/queries/mealQueries.ts');
const { useMealList } = require('../../../src/data/queries/mealLogQueries.ts');
beforeEach(async () => { values.clear(); await clearSession(); });
const { mealFromDraft } = require('../../../src/features/meal-checkin/rules.ts');
const { readMealDraft, saveMealDraft, readMeals, readMeal } = require('../../../src/data/storage/mealStorage.ts');
const json = value => new Response(JSON.stringify(value));
const unavailable = () => new Response('{"error_code":"UNAVAILABLE"}', { status: 503 });
async function mountSaving(t) {
  const draft = { ...completeDraft('1'), mealDate: '2026-10-23' };
  await saveMealDraft(draft);
  const existing = { ...mealResponse(), id: '11', meal_date: '2026-10-22',
    foods: [{ ...mealResponse().foods[0], meal_id: '11' }] };
  const server = { items: [existing], writes: 0, reads: 0, failWrite: false, failList: false };
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname + new URL(url).search;
    if (path === '/api/v1/meals/10' && (init.method ?? 'GET') === 'GET') {
      const meal = server.items.find(item => item.id === '10');
      return meal ? json(meal) : Response.json({ error_code: 'NOT_FOUND' }, { status: 404 });
    }
    assert.equal(path, '/api/v1/meals');
    if ((init.method ?? 'GET') === 'GET') {
      server.reads++;
      return server.failList ? unavailable() : json(server.items);
    }
    assert.equal(init.method, 'PUT');
    assert.deepEqual(JSON.parse(init.body), {
      meal_date: '2026-10-23', meal_type: 'LUNCH', setting: 'HOME', before_photo_uri: null,
      foods: [{ name: 'Rice', ingredients: [], cooking_method: null,
        serving_note: null, acceptance: null, food_recommendation_ids: [] }],
    });
    server.writes++;
    if (server.failWrite) return unavailable();
    const saved = mealResponse();
    server.items = [saved, ...server.items.filter(item => item.id !== saved.id)];
    // 저장 응답은 서버가 발급한 음식 id 를 담은 식사 상세다.
    return json(saved);
  });
  const hook = await renderHook(t, () => ({ save: useSaveMeal(), list: useMealList('1', null) }));
  await waitFor(() => hook.current.list.isSuccess);
  return { hook, server, save: () => hook.current.save.mutateAsync(mealFromDraft(draft)) };
}
async function expectSaved(hook) {
  await waitFor(() => hook.current.list.isSuccess && !hook.current.list.isFetching
    && hook.current.list.data?.map(meal => meal.id).join() === '10,11');
  assert.equal(hook.current.list.data[0].foods[0].name, 'Rice');
  const receipt = await readMealDraft('1');
  assert.equal(receipt.step, 'complete');
  assert.equal(receipt.savedMealId, '10');
  assert.equal(receipt.foods[0].id, '1');
  assert.deepEqual((await readMeals('1')).map(meal => meal.id), ['10']);
  assert.equal((await readMeal('1', '10')).savedAt, '2026-10-23T00:00:00Z');
}

test('식사 저장 후 목록 재조회가 실패하면 기존 목록을 유지하고 조회 재시도 후 저장한 식사가 표시된다', async t => {
  const { hook, server, save } = await mountSaving(t);
  const before = hook.current.list.data;
  server.failList = true;
  await act(async () => { await save(); });
  await waitFor(() => hook.current.list.isRefetchError);
  assert.deepEqual(hook.current.list.data, before);
  assert.equal((await readMealDraft('1')).savedMealId, '10');
  server.failList = false;
  await act(async () => { await hook.current.list.refetch(); });
  await expectSaved(hook);
  assert.equal(server.writes, 1);
});

test('기기 식사 목록 저장이 실패해도 서버 목록과 상세에 새 식사가 표시되고 기기 초안은 완료로 바뀐다', async t => {
  const { hook, server, save } = await mountSaving(t);
  // 기기 목록은 이미 조회한 상태로 시작해, 저장 실패 뒤 다시 읽었는지 확인한다.
  hook.client.setQueryData(['meals', '1'], []);
  const queries = await renderHook(t, () => ({
    meals: useMeals('1'), draft: useMealDraft('1'), detail: useMealDetail('1', '10'),
  }), { client: hook.client });
  await waitFor(() => queries.current.detail.isError && queries.current.draft.isSuccess);
  assert.deepEqual(hook.current.list.data.map(meal => meal.id), ['11']);
  assert.equal(queries.current.meals.isFetchedAfterMount, false);
  assert.equal(queries.current.draft.data.step, 'foods');

  failNextWrite('nurturebites.meals.1.v1');
  await act(async () => { assert.equal((await save()).id, '10'); });

  await waitFor(() => hook.current.list.data.length === 2 && queries.current.detail.isSuccess
    && queries.current.meals.isFetchedAfterMount && queries.current.draft.data.step === 'complete');
  assert.deepEqual(hook.current.list.data.map(meal => meal.id), ['10', '11']);
  assert.equal(queries.current.detail.data.id, '10');
  assert.equal(queries.current.detail.data.foods[0].name, 'Rice');
  assert.deepEqual(queries.current.meals.data, []);
  assert.equal(queries.current.draft.data.savedMealId, '10');
  assert.equal(server.writes, 1);
});
