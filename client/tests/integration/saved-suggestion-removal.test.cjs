// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 저장 추천 삭제·중복 클릭·실패 재시도·늦은 조회 응답 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { React, act, renderHook, waitFor, deferred } = require('../helpers/react-harness.cjs');
const { values } = require('../helpers/native-boundaries.cjs').nativeBoundaries(name =>
  name === 'expo-router'
    ? { useFocusEffect: callback => React.useEffect(callback, [callback]) }
    : undefined);
const { clearSession } = require('../../src/data/storage/authStorage.ts');
const { useSavedSuggestionsScreen } = require('../../src/features/suggestions/hooks/useSavedSuggestionsScreen.ts');
const { useMealSuggestions } = require('../../src/data/queries/mealSuggestionQueries.ts');
const { suggestionResponse } = require('../fixtures/server-suggestion.cjs');
const { mealResponse } = require('../fixtures/server-meal.cjs');

beforeEach(async () => { values.clear(); await clearSession(); });
const json = value => Response.json(value);
const noContent = () => new Response(null, { status: 204 });
const unavailable = () => jsonError('UNAVAILABLE', 503);
const jsonError = (error_code, status) => Response.json({ error_code }, { status });
const ids = model => model.saved.data.map(item => item.id);

// 화면 Hook·Query·API·DTO는 실제로 연결하고 HTTP와 기기 저장소만 대체한다.
function setup(t, status = 'TRIED') {
  const tried = suggestionResponse({ id: '31', status, saved_at: '2026-11-18T00:00:00Z' });
  const another = suggestionResponse({ id: '32', origin_food_id: '3', status: 'SAVED',
    saved_at: '2026-11-18T00:00:00Z' });
  const meal = mealResponse();
  meal.foods[0].recommendation_tries = status === 'TRIED' ? [{
    id: '41', food_recommendation_id: '31', feedback: 'HELPFUL',
    created_at: '2026-11-18T00:00:00Z', updated_at: '2026-11-18T00:00:00Z',
    recommendation: { what_to_try: tried.what_to_try,
      why_this_may_help: tried.why_this_may_help, serving_tip: tried.serving_tip },
  }] : [];
  const server = {
    items: [tried, another], visible: new Set(['31', '32']), meals: [meal],
    remove: async () => noContent(), list: null, writes: [],
  };
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    const method = init.method ?? 'GET';
    if (method === 'GET' && path === '/api/v1/meals') return json(server.meals);
    if (method === 'GET' && path === '/api/v1/meals/8/suggestions') return json(server.items);
    if (method === 'GET' && path === '/api/v1/suggestions') {
      return server.list ? server.list(init.signal)
        : json(server.items.filter(item => server.visible.has(item.id)));
    }
    assert.equal(method, 'DELETE');
    assert.equal(init.body, undefined);
    server.writes.push({ method, path });
    if (path === '/api/v1/suggestions/31/decision') {
      // 34.2의 원래 실패: 시도한 추천은 추천 결정 Undo로 되돌릴 수 없다.
      if (tried.status === 'TRIED') return jsonError('RECOMMENDATION_ALREADY_TRIED', 409);
      const response = await server.remove();
      if (!response.ok) return response;
      server.visible.delete('31');
      server.items = server.items.map(item => item.id === '31'
        ? { ...item, status: 'PENDING', saved_at: null } : item);
      return json(server.items[0]);
    }
    assert.equal(path, '/api/v1/suggestions/31/saved');
    const response = await server.remove();
    if (response.ok) server.visible.delete('31');
    return response;
  });
  return server;
}
async function mount(t) {
  let hook;
  // 실패한 assertion 뒤에도 예약된 Query 알림을 처리한 다음 화면 환경을 정리한다.
  t.after(async () => {
    await act(async () => {
      await hook?.client.cancelQueries();
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });
  hook = await renderHook(t, () => ({
    screen: useSavedSuggestionsScreen('1', '31'),
    mealSuggestions: useMealSuggestions('1', '8'),
  }));
  await waitFor(() => hook.current.screen.saved.isSuccess && hook.current.screen.meals.isSuccess
    && hook.current.mealSuggestions.isSuccess);
  return hook;
}
function preserved(hook) {
  return structuredClone({
    mealSuggestions: hook.current.mealSuggestions.data,
    meals: hook.current.screen.meals.data,
  });
}
function assertPreserved(hook, before) {
  assert.deepEqual(hook.current.mealSuggestions.data, before.mealSuggestions);
  assert.deepEqual(hook.current.screen.meals.data, before.meals);
  if (before.meals[0].suggestionLinks.length) {
    assert.equal(hook.current.screen.meals.data[0].suggestionLinks[0].feedback, 'helpful');
  }
}
const deleteRequest = { method: 'DELETE', path: '/api/v1/suggestions/31/saved' };

for (const status of ['SAVED', 'TRIED']) {
  test(`${status} 추천을 저장 목록에서 삭제해도 추천 상태와 식사 시도·피드백을 보존한다`, async t => {
    const server = setup(t, status);
    const hook = await mount(t);
    const before = preserved(hook);
    assert.deepEqual(hook.current.screen.linkedMeals.map(meal => meal.id), status === 'TRIED' ? ['10'] : []);
    let removed;
    await act(async () => { removed = await hook.current.screen.remove(); });
    assert.equal(removed, true);
    await waitFor(() => ids(hook.current.screen).join() === '32');
    assert.equal(hook.current.screen.selectedId, '');
    assert.equal(hook.current.screen.removeFailed, false);
    assert.deepEqual(server.writes, [deleteRequest]);
    assertPreserved(hook, before);
    let closed;
    await act(async () => { hook.current.screen.setSelectedId('32'); });
    await act(async () => { closed = hook.current.screen.close(); });
    assert.equal(closed, true);
    assert.equal(hook.current.screen.selectedId, '');
  });
}

test('삭제 대기 중 상세·목록을 유지하고 같은 tick의 중복 삭제·닫기·다른 선택을 막는다', async t => {
  const server = setup(t, 'SAVED');
  const hook = await mount(t);
  const before = preserved(hook);
  const response = deferred();
  server.remove = () => response.promise;
  let first, second, closed;
  try {
    await act(async () => {
      const model = hook.current.screen;
      first = model.remove();
      second = model.remove();
      closed = model.close();
      model.setSelectedId('32');
    });
    await waitFor(() => server.writes.length > 0);
    assert.deepEqual(server.writes, [deleteRequest]);
    assert.equal(await second, false);
    assert.equal(closed, false);
    assert.equal(hook.current.screen.removing, true);
    assert.equal(hook.current.screen.selectedId, '31');
    assert.equal(hook.current.screen.selected.id, '31');
    assert.deepEqual(ids(hook.current.screen), ['31', '32']);
    assertPreserved(hook, before);
    await act(async () => { response.resolve(noContent()); assert.equal(await first, true); });
    await waitFor(() => !hook.current.screen.removing && hook.current.screen.selectedId === '');
    assert.deepEqual(ids(hook.current.screen), ['32']);
    assertPreserved(hook, before);
  } finally {
    await act(async () => { response.resolve(noContent()); await Promise.allSettled([first, second]); });
  }
});

for (const failure of ['503', 'network']) {
  test(`삭제 ${failure} 실패는 상세·목록을 보존하고 명시적 재시도로 해당 추천만 제거한다`, async t => {
    const server = setup(t);
    const hook = await mount(t);
    const before = preserved(hook);
    const saved = structuredClone(hook.current.screen.saved.data);
    server.remove = failure === '503' ? unavailable : async () => { throw new TypeError('Network failed'); };
    let removed;
    await act(async () => { removed = await hook.current.screen.remove(); });
    assert.equal(removed, false);
    await waitFor(() => hook.current.screen.removeFailed && !hook.current.screen.removing);
    assert.equal(hook.current.screen.selectedId, '31');
    assert.equal(hook.current.screen.selected.id, '31');
    assert.deepEqual(hook.current.screen.saved.data, saved);
    assert.deepEqual(server.writes, [deleteRequest]);
    assertPreserved(hook, before);
    server.remove = async () => noContent();
    await act(async () => { removed = await hook.current.screen.remove(); });
    assert.equal(removed, true);
    await waitFor(() => hook.current.screen.selectedId === '' && ids(hook.current.screen).join() === '32');
    assert.equal(hook.current.screen.removeFailed, false);
    assert.deepEqual(server.writes, [deleteRequest, deleteRequest]);
    assertPreserved(hook, before);
  });
}

test('삭제 전에 시작한 느린 목록 응답이 204 이후 도착해도 제거한 추천을 되살리지 않는다', async t => {
  const server = setup(t);
  const hook = await mount(t);
  const before = preserved(hook);
  const response = deferred();
  const started = deferred();
  const stale = structuredClone(server.items);
  let held = false, refresh;
  server.list = () => {
    if (!held) { held = true; started.resolve(); return response.promise; }
    return json(server.items.filter(item => server.visible.has(item.id)));
  };
  try {
    await act(async () => { refresh = hook.current.screen.saved.refetch(); });
    await started.promise;
    let removed;
    await act(async () => { removed = await hook.current.screen.remove(); });
    assert.equal(removed, true);
    await waitFor(() => ids(hook.current.screen).join() === '32');
    await act(async () => { response.resolve(json(stale)); await refresh; });
    assert.deepEqual(ids(hook.current.screen), ['32']);
    assert.equal(hook.current.screen.selectedId, '');
    assert.deepEqual(server.writes, [deleteRequest]);
    assertPreserved(hook, before);
  } finally {
    await act(async () => { response.resolve(json(stale)); await Promise.allSettled([refresh]); });
  }
});

test('삭제 성공 후 목록 재조회가 실패해도 제거 결과와 나머지 카드·식사 기록을 유지한다', async t => {
  const server = setup(t);
  const hook = await mount(t);
  const before = preserved(hook);
  server.list = unavailable;
  let removed;
  await act(async () => { removed = await hook.current.screen.remove(); });
  assert.equal(removed, true);
  await waitFor(() => hook.current.screen.saved.isRefetchError);
  assert.equal(hook.current.screen.selectedId, '');
  assert.equal(hook.current.screen.removeFailed, false);
  assert.deepEqual(ids(hook.current.screen), ['32']);
  assert.deepEqual(server.writes, [deleteRequest]);
  assertPreserved(hook, before);
});
