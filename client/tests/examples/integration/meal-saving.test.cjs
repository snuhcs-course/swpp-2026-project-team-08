// AI-generated with GPT-6, 2026-10-31, reviewed by Haechan Jung
// Changed: 식사 저장의 성공·실패·복구 Integration 예시

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');

const { completeDraft } = require('../../fixtures/meal-checkin.cjs');
const { mealResponse } = require('../../fixtures/server-meal.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries();
const { clearSession } = require('../../../src/data/storage/authStorage.ts');
const { readMealDraft, saveMealDraft, readMeals } = require('../../../src/data/storage/mealStorage.ts');
const { mealFromDraft } = require('../../../src/features/meal-checkin/rules.ts');
const { useSaveMeal } = require('../../../src/data/queries/mealQueries.ts');
const { useMealList } = require('../../../src/data/queries/mealLogQueries.ts');

// 실제 Hook·API·Query·Storage를 연결한다. HTTP와 기기 저장 매체만 대체한다.
beforeEach(async () => {
  await clearSession();
  values.clear();
});

// 같은 기능의 시나리오는 한 파일에 둔다. 행동 순서가 다르면 별도 test로 작성한다.
test('저장에 성공하면 목록을 갱신하고 초안을 완료 처리한다', async (t) => {
  // 준비
  const { hook, meal } = await prepareSaving(t);
  assert.deepEqual(hook.current.list.data.map(item => item.id), ['11']);

  // 실행
  await act(async () => { await hook.current.save.mutateAsync(meal); });
  await waitFor(() => hook.current.list.data?.[0]?.id === '10');

  // 검증: 호출 여부뿐 아니라 목록·초안·로컬 저장 결과를 확인한다.
  assert.deepEqual(hook.current.list.data.map(item => item.id), ['10', '11']);
  assert.equal(hook.current.list.data[0].foods[0].name, 'Rice');
  const draft = await readMealDraft('1');
  assert.equal(draft.step, 'complete');
  assert.equal(draft.savedMealId, '10');
  assert.deepEqual((await readMeals('1')).map(item => item.id), ['10']);
});

test('저장이 실패하면 입력한 초안과 기존 목록을 유지한다', async (t) => {
  // 준비
  const { hook, meal, server } = await prepareSaving(t);
  const beforeDraft = await readMealDraft('1');
  const beforeList = hook.current.list.data;
  server.failSave = true;

  // 실행
  await act(async () => {
    await assert.rejects(() => hook.current.save.mutateAsync(meal), /UNAVAILABLE/);
  });
  await waitFor(() => hook.current.save.isError);

  // 검증
  assert.deepEqual(await readMealDraft('1'), beforeDraft);
  assert.deepEqual(hook.current.list.data, beforeList);
  assert.deepEqual(await readMeals('1'), []);
  assert.deepEqual(server.items.map(item => item.id), ['11']);
});

test('저장 실패 후 재시도하면 기록이 한 번만 반영된다', async (t) => {
  // 준비
  const { hook, meal, server } = await prepareSaving(t);
  server.failSave = true;

  // 실행: 실패 → 재시도 순서를 본문에 드러낸다.
  await act(async () => {
    await assert.rejects(() => hook.current.save.mutateAsync(meal), /UNAVAILABLE/);
  });
  await waitFor(() => hook.current.save.isError);
  server.failSave = false;
  await act(async () => { await hook.current.save.mutateAsync(meal); });
  await waitFor(() => hook.current.list.data?.[0]?.id === '10');

  // 검증: 서버 mock의 결과뿐 아니라 실제 Query·Storage 결과를 확인한다.
  assert.equal(hook.current.save.isSuccess, true);
  assert.equal(server.saveAttempts, 2);
  assert.deepEqual(hook.current.list.data.map(item => item.id), ['10', '11']);
  assert.deepEqual((await readMeals('1')).map(item => item.id), ['10']);
  assert.equal((await readMealDraft('1')).savedMealId, '10');
});

test('저장 후 목록 조회가 실패해도 저장 결과를 유지하고 재조회로 복구한다', async (t) => {
  // 준비
  const { hook, meal, server } = await prepareSaving(t);
  const beforeList = hook.current.list.data;
  server.failList = true;

  // 실행
  await act(async () => { await hook.current.save.mutateAsync(meal); });
  await waitFor(() => hook.current.list.isRefetchError);

  // 검증: 조회 실패를 저장 실패로 취급하지 않는다.
  assert.equal(hook.current.save.isSuccess, true);
  assert.deepEqual(hook.current.list.data, beforeList);
  assert.equal((await readMealDraft('1')).savedMealId, '10');
  assert.deepEqual((await readMeals('1')).map(item => item.id), ['10']);

  // 복구: 저장을 반복하지 않고 목록만 다시 조회한다.
  server.failList = false;
  await act(async () => { await hook.current.list.refetch(); });
  await waitFor(() => hook.current.list.isSuccess && !hook.current.list.isFetching);
  assert.deepEqual(hook.current.list.data.map(item => item.id), ['10', '11']);
  assert.equal(server.saveAttempts, 1);
});

// 반복되는 초기 데이터·HTTP 설정·마운트만 묶는다. 행동과 핵심 검증은 test에 둔다.
async function prepareSaving(t) {
  // Fixture는 데이터 준비에 사용하고, 기대 결과는 테스트에 직접 적는다.
  const draft = { ...completeDraft('1'), mealDate: '2026-10-23' };
  await saveMealDraft(draft);
  const existing = mealResponse();
  existing.id = '11';
  existing.meal_date = '2026-10-22';
  existing.foods[0].meal_id = '11';
  const server = { items: [existing], failSave: false, failList: false, saveAttempts: 0 };

  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    assert.equal(new URL(url).pathname + new URL(url).search, '/api/v1/meals');
    const method = options.method ?? 'GET';
    if (method === 'GET') {
      return server.failList ? unavailable() : json(server.items);
    }
    assert.equal(method, 'PUT', '예상하지 않은 HTTP 요청');
    server.saveAttempts++;
    assert.deepEqual(JSON.parse(options.body), {
      meal_date: '2026-10-23', meal_type: 'lunch', setting: 'home', before_photo_uri: null,
      foods: [{ id: '1', name: 'Rice', ingredients: [], cooking_method: null,
        serving_note: null, acceptance: null }], suggestion_links: [],
    });
    if (server.failSave) return unavailable();
    const saved = mealResponse();
    server.items = [saved, ...server.items.filter(item => item.id !== saved.id)];
    const { foods, review, suggestion_links, ...receipt } = saved;
    return json(receipt);
  });

  const hook = await renderHook(t, () => ({
    save: useSaveMeal(),
    list: useMealList('1', null),
  }));
  await waitFor(() => hook.current.list.isSuccess);
  return { hook, server, meal: mealFromDraft(draft) };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function unavailable() {
  return json({ error_code: 'UNAVAILABLE' }, 503);
}
