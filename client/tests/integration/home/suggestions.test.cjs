// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 홈 추천 조회·실패 복구·캐시 공유와 사용자 전환 검증

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries((name) => {
  if (name === 'react-native') return { StyleSheet: { create: value => value } };
  if (name === 'expo-image') return { Image: () => null };
  if (name === '@expo/vector-icons') return { Feather: () => null };
});
require.extensions['.svg'] = (module, file) => { module.exports = file; };
const { mealResponse } = require('../../fixtures/server-meal.cjs');
const { suggestionResponse } = require('../../fixtures/server-suggestion.cjs');
const { clearSession } = require('../../../src/data/storage/authStorage.ts');
const { useHome } = require('../../../src/features/home/hooks/useHome.ts');
const { useMealSuggestionActions } = require('../../../src/data/queries/mealSuggestionQueries.ts');
const { mealLogKeys } = require('../../../src/data/queries/mealQueryKeys.ts');

beforeEach(async () => { values.clear(); await clearSession(); });
const json = value => new Response(JSON.stringify(value));
const unavailable = () => new Response('{"error_code":"UNAVAILABLE"}', { status: 503 });
function meal(id = '10', outcome = 'TASTED', userId = '1') {
  const base = mealResponse();
  return { ...base, id, user_id: userId,
    foods: [{ ...base.foods[0], id: `${id}1`, meal_id: id, outcome }] };
}
function suggestion(mealId = '10', status = 'PENDING', userId = '1') {
  return suggestionResponse({ id: '31', meal_id: mealId, origin_food_id: `${mealId}1`,
    status, user_id: userId });
}
function setup(t, meals = [meal()], suggestions = { '10': [] }) {
  const server = { meals, suggestions, calls: [] };
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname + new URL(url).search;
    const method = init.method ?? 'GET';
    server.calls.push({ method, path });
    if (method === 'GET' && path === '/api/v1/meals') return json(server.meals);
    if (method === 'GET' && path === '/api/v1/suggestions') return json([]);
    const match = path.match(/^\/api\/v1\/meals\/(\d+)\/suggestions\?status=ALL$/);
    if (method === 'GET' && match) {
      const response = server.suggestions[match[1]];
      assert.notEqual(response, undefined, `Unexpected meal: ${match[1]}`);
      return typeof response === 'function' ? response() : json(response);
    }
    if (path === '/api/v1/suggestions/31/decision' && ['PUT', 'DELETE'].includes(method)) {
      const status = method === 'DELETE' ? 'PENDING' : JSON.parse(init.body).status;
      server.suggestions['10'] = [suggestion('10', status)];
      return json(server.suggestions['10'][0]);
    }
    assert.fail(`Unexpected request: ${method} ${path}`);
  });
  return server;
}
const ids = home => home.suggestionMeals.map(item => item.id);
const settled = home => !home.loading && !home.suggestionMealsLoading && !home.refreshing;
async function mount(t) {
  const hook = await renderHook(t, profile => useHome(profile), { props: { id: '1' } });
  await waitFor(() => settled(hook.current));
  return hook;
}

test('리뷰가 있는 식사만 전체 추천을 조회하고 원본 MealDetail을 그대로 제공한다', async t => {
  const server = setup(t, [meal('10'), meal('20', null), meal('30', 'EATEN')],
    { '10': [suggestion('10', 'SAVED')], '30': [] });
  const hook = await mount(t);
  assert.deepEqual(ids(hook.current), ['30']);
  assert.deepEqual(hook.current.pendingMeals.map(item => item.id), ['20']);
  const original = hook.client.getQueryData(mealLogKeys.list('1', null));
  assert.equal(hook.current.suggestionMeals[0], original[2]);
  assert.equal(hook.current.pendingMeals[0], original[1]);
  assert.equal(server.calls.some(call => call.path.includes('/20/suggestions')), false);
  assert.equal(server.calls.every(call => call.method === 'GET'), true);
});

for (const { title, response } of [
  { title: '추천 조회 실패', response: unavailable },
  { title: '잘못된 소유자의 추천 응답', response: () => json([suggestion('10', 'SAVED', '2')]) },
]) {
  test(`${title}: 미생성으로 표시하지 않고 새로고침으로 복구한다`, async t => {
    const server = setup(t, [meal()], { '10': response });
    const hook = await mount(t);
    assert.equal(hook.current.suggestionMealsError, true);
    assert.deepEqual(ids(hook.current), []);
    server.suggestions['10'] = [];
    await act(async () => { await hook.current.refresh(); });
    await waitFor(() => settled(hook.current) && !hook.current.suggestionMealsError);
    assert.deepEqual(ids(hook.current), ['10']);
  });
}

test('최초 추천 조회 중에는 미생성 식사로 표시하지 않는다', async t => {
  const response = deferred();
  setup(t, [meal()], { '10': () => response.promise });
  const hook = await renderHook(t, () => useHome({ id: '1' }));
  await waitFor(() => !hook.current.loading && hook.current.suggestionMealsLoading);
  assert.deepEqual(ids(hook.current), []);
  await act(async () => response.resolve(json([])));
  await waitFor(() => settled(hook.current));
  assert.deepEqual(ids(hook.current), ['10']);
});

test('재조회 중·실패에도 기존 카드를 유지하고 성공 후 처리 상태를 반영한다', async t => {
  const server = setup(t);
  const hook = await mount(t);
  const refresh = hook.current.refresh;
  const response = deferred();
  server.suggestions['10'] = () => response.promise;
  let refreshing;
  await act(async () => { refreshing = hook.current.refresh(); });
  await waitFor(() => hook.current.refreshing);
  assert.deepEqual(ids(hook.current), ['10']);
  await act(async () => { response.resolve(unavailable()); await refreshing; });
  await waitFor(() => hook.current.suggestionMealsError);
  assert.deepEqual(ids(hook.current), ['10']);
  server.suggestions['10'] = [suggestion('10', 'SAVED')];
  await act(async () => { await hook.current.refresh(); });
  await waitFor(() => !hook.current.refreshing && !hook.current.suggestionMealsError);
  assert.deepEqual(ids(hook.current), []);
  assert.equal(hook.current.refresh, refresh);
});

test('추천 화면의 저장·거절·Undo 성공이 홈의 같은 캐시에 반영된다', async t => {
  setup(t, [meal()], { '10': [suggestion()] });
  const hook = await renderHook(t, () => ({
    home: useHome({ id: '1' }), actions: useMealSuggestionActions('1', '10'),
  }));
  await waitFor(() => settled(hook.current.home));
  assert.deepEqual(ids(hook.current.home), ['10']);
  for (const decision of [
    { id: '31', status: 'saved' },
    { id: '31', status: 'dismissed', reasons: ['already_tried'] },
  ]) {
    await act(async () => { await hook.current.actions.decide.mutateAsync(decision); });
    await waitFor(() => ids(hook.current.home).length === 0);
    await act(async () => { await hook.current.actions.undo.mutateAsync('31'); });
    await waitFor(() => ids(hook.current.home).join() === '10');
  }
});

test('홈 복귀 시 새 리뷰의 추천을 조회하고 삭제된 식사는 목록에서 제거한다', async t => {
  const server = setup(t, [meal('10', null)]);
  const hook = await mount(t);
  assert.deepEqual(ids(hook.current), []);
  server.meals = [meal()];
  await act(async () => { await hook.current.refresh(); });
  await waitFor(() => ids(hook.current).join() === '10');
  server.meals = [];
  await act(async () => { await hook.current.refresh(); });
  await waitFor(() => settled(hook.current) && ids(hook.current).length === 0);
});

test('사용자 전환 후 이전 사용자의 늦은 응답은 현재 목록을 바꾸지 않는다', async t => {
  const response = deferred();
  const server = setup(t, [meal()], { '10': () => response.promise, '20': [] });
  const hook = await renderHook(t, profile => useHome(profile), { props: { id: '1' } });
  await waitFor(() => !hook.current.loading && hook.current.suggestionMealsLoading);
  server.meals = [meal('20', 'TASTED', '2')];
  await hook.rerender({ id: '2' });
  assert.equal(ids(hook.current).includes('10'), false);
  await waitFor(() => settled(hook.current) && ids(hook.current).join() === '20');
  await act(async () => response.resolve(json([])));
  assert.deepEqual(ids(hook.current), ['20']);
});
