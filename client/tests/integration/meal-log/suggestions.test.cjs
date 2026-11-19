// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 식사 상세 추천 진입의 서버 조회·실패 상태·공유 캐시 검증

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries();
const { mealResponse } = require('../../fixtures/server-meal.cjs');
const { suggestionResponse } = require('../../fixtures/server-suggestion.cjs');
const { clearSession } = require('../../../src/data/storage/authStorage.ts');
const { useMealDetails } = require('../../../src/features/meal-log/hooks/useMealDetails.ts');
const { useMealSuggestionActions } = require('../../../src/data/queries/mealSuggestionQueries.ts');

beforeEach(async () => { values.clear(); await clearSession(); });
const json = value => new Response(JSON.stringify(value));
const unavailable = () => new Response('{"error_code":"UNAVAILABLE"}', { status: 503 });
function meal(outcomes = ['TASTED'], id = '10', userId = '1') {
  const base = mealResponse();
  return { ...base, id, user_id: userId,
    foods: outcomes.map((outcome, index) => ({
      ...base.foods[0], id: String(index + 1), meal_id: id, outcome,
    })) };
}
function suggestion(status = 'PENDING', overrides = {}) {
  return suggestionResponse({ meal_id: '10', origin_food_id: '1', status, ...overrides });
}
function setup(t, currentMeal = meal(), recommendations = []) {
  const server = { meals: { [currentMeal.id]: currentMeal }, suggestions: { [currentMeal.id]: recommendations }, calls: [] };
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname + new URL(url).search;
    const method = init.method ?? 'GET';
    server.calls.push({ method, path });
    const detail = path.match(/^\/api\/v1\/meals\/(\d+)$/);
    if (method === 'GET' && detail) return json(server.meals[detail[1]]);
    const suggestions = path.match(/^\/api\/v1\/meals\/(\d+)\/suggestions\?status=ALL$/);
    if (method === 'GET' && suggestions) {
      const response = server.suggestions[suggestions[1]];
      assert.notEqual(response, undefined, `예상하지 않은 추천 조회: ${suggestions[1]}`);
      return typeof response === 'function' ? response() : json(response);
    }
    if (path === '/api/v1/suggestions/31/decision' && ['PUT', 'DELETE'].includes(method)) {
      const status = method === 'DELETE' ? 'PENDING' : JSON.parse(init.body).status;
      server.suggestions['10'] = [suggestion(status)];
      return json(server.suggestions['10'][0]);
    }
    assert.fail(`예상하지 않은 요청: ${method} ${path}`);
  });
  return server;
}
const settled = details => !details.loading && !details.suggestionsLoading;
async function mount(t) {
  const hook = await renderHook(t, () => useMealDetails('1', '10'));
  await waitFor(() => settled(hook.current));
  return hook;
}

const visibilityCases = [
  { title: '식후 리뷰 없음: 추천을 조회하되 버튼 숨김', outcomes: [null], recommendations: [], visible: false },
  { title: '음식 없음: 추천을 조회하되 버튼 숨김', outcomes: [], recommendations: [], visible: false },
  { title: 'Eaten 음식의 추천 미생성: 표시', outcomes: ['EATEN'], recommendations: [], visible: true },
  { title: 'pending 추천 있음: 표시', outcomes: ['TASTED'], recommendations: [suggestion()], visible: true },
  { title: '시도까지 마친 추천만 있음: 숨김', outcomes: ['EATEN'], recommendations: [suggestion('TRIED')], visible: false },
  {
    title: '음식 4개 중 생성한 추천 3개 모두 처리: 미생성 음식이 있어도 숨김',
    outcomes: ['EATEN', 'TASTED', 'UNTOUCHED', 'UNCLEAR'],
    recommendations: ['SAVED', 'DISMISSED', 'SAVED'].map((status, index) =>
      suggestion(status, { id: String(31 + index), origin_food_id: String(index + 1) })),
    visible: false,
  },
];
for (const { title, outcomes, recommendations, visible } of visibilityCases) {
  test(title, async t => {
    const server = setup(t, meal(outcomes), recommendations);
    const hook = await mount(t);
    assert.equal(hook.current.canViewSuggestions, visible);
    assert.equal(hook.current.suggestionsError, false);
    assert.equal(server.calls.some(({ path }) => path.endsWith('/suggestions?status=ALL')), true);
    assert.ok(server.calls.every(({ method }) => method === 'GET'));
  });
}

for (const { title, recommendations, visible } of [
  { title: '생성한 추천 없음', recommendations: [], visible: true },
  { title: '생성한 추천 처리 완료', recommendations: [suggestion('SAVED')], visible: false },
]) {
  test(`시도 연결이 있어도 생성 추천 상태로 판단한다: ${title}`, async t => {
    const currentMeal = meal();
    currentMeal.foods[0].recommendation_tries = [{
      id: '90', food_recommendation_id: '80', feedback: null,
      created_at: '2026-10-23T00:00:00Z', updated_at: '2026-10-23T00:00:00Z',
      recommendation: { what_to_try: 'Try soup', why_this_may_help: 'Familiar taste', serving_tip: null },
    }];
    setup(t, currentMeal, recommendations);
    const hook = await mount(t);
    assert.equal(hook.current.cards[0].suggestion.id, '80');
    assert.equal(hook.current.canViewSuggestions, visible);
  });
}

for (const { title, response } of [
  { title: '최초 추천 조회 실패', response: unavailable },
  { title: '다른 사용자의 추천 응답', response: () => json([suggestion('SAVED', { user_id: '2' })]) },
]) {
  test(`${title}: 버튼을 숨기고 식사 상세는 유지한다`, async t => {
    setup(t, meal(), response);
    const hook = await mount(t);
    assert.equal(hook.current.suggestionsError, true);
    assert.equal(hook.current.canViewSuggestions, false);
    assert.equal(hook.current.error, false);
    assert.equal(hook.current.meal.id, '10');
  });
}

test('최초 추천 조회 중에는 미생성으로 판단하지 않는다', async t => {
  const response = deferred();
  setup(t, meal(), () => response.promise);
  const hook = await renderHook(t, () => useMealDetails('1', '10'));
  await waitFor(() => !hook.current.loading && hook.current.suggestionsLoading);
  assert.equal(hook.current.canViewSuggestions, false);
  await act(async () => response.resolve(json([])));
  await waitFor(() => settled(hook.current) && hook.current.canViewSuggestions);
});

test('추천 화면의 저장·제외·Undo 결과가 식사 상세의 같은 캐시에 반영된다', async t => {
  setup(t, meal(), [suggestion()]);
  const hook = await renderHook(t, () => ({
    details: useMealDetails('1', '10'), actions: useMealSuggestionActions('1', '10'),
  }));
  await waitFor(() => settled(hook.current.details) && hook.current.details.canViewSuggestions);
  for (const decision of [
    { id: '31', status: 'saved' },
    { id: '31', status: 'dismissed', reasons: ['already_tried'] },
  ]) {
    await act(async () => { await hook.current.actions.decide.mutateAsync(decision); });
    await waitFor(() => !hook.current.details.canViewSuggestions);
    await act(async () => { await hook.current.actions.undo.mutateAsync('31'); });
    await waitFor(() => hook.current.details.canViewSuggestions);
  }
});

test('계정·식사 전환 후 이전 추천 응답은 현재 상세의 버튼을 바꾸지 않는다', async t => {
  const response = deferred();
  const server = setup(t, meal(), () => response.promise);
  server.meals['20'] = meal(['EATEN'], '20', '2');
  server.suggestions['20'] = [suggestion('SAVED', { meal_id: '20', user_id: '2' })];
  const hook = await renderHook(t, ({ userId, mealId }) => useMealDetails(userId, mealId), {
    props: { userId: '1', mealId: '10' },
  });
  await waitFor(() => !hook.current.loading && hook.current.suggestionsLoading);
  await hook.rerender({ userId: '2', mealId: '20' });
  assert.equal(hook.current.canViewSuggestions, false);
  await waitFor(() => settled(hook.current) && hook.current.meal?.id === '20');
  await act(async () => response.resolve(json([])));
  assert.equal(hook.current.canViewSuggestions, false);
  assert.equal(hook.current.meal.id, '20');
});


test('식사 상세 조회를 기다리지 않고 추천 목록도 함께 조회한다', async t => {
  const detailResponse = deferred();
  let suggestionsRequested = false;
  t.mock.method(global, 'fetch', async url => {
    const path = new URL(url).pathname;
    if (path === '/api/v1/meals/10') return detailResponse.promise;
    assert.equal(path, '/api/v1/meals/10/suggestions');
    suggestionsRequested = true;
    return json([]);
  });
  const hook = await renderHook(t, () => useMealDetails('1', '10'));
  await waitFor(() => suggestionsRequested && !hook.current.suggestionsLoading);
  assert.equal(hook.current.loading, true);
  assert.equal(hook.current.canViewSuggestions, false);
  await act(async () => detailResponse.resolve(json(meal(['EATEN']))));
  await waitFor(() => hook.current.canViewSuggestions);
});
