// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Food targets, automatic generation, reselection and retry boundaries
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 서버 식사 상세·음식 단위 추천 응답 모양으로 수정
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: Eaten 추천 제외 및 음식 단위 요청 검증

// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 음식 단위 추천 요청 기대값 반영
// AI-generated with GPT-6, 2026-11-13, reviewed by Haechan Jung
// Changed: 선택적 추가 추천·중복 클릭·응답 복구·대상 재선택 검증

// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 추천 거절 후 재생성·취소·늦은 응답 검증 분리
const { test } = require("node:test");
const assert = require("node:assert/strict");
require("../../helpers/register.cjs");
const { mealWithFoods, card } = require("../../fixtures/suggestion-generation.cjs");
const {
  React,
  act,
  renderHook,
  waitFor,
  deferred,
} = require("../../helpers/react-harness.cjs");
require("../../helpers/native-boundaries.cjs").nativeBoundaries((name) =>
  name === "expo-router"
    ? { useFocusEffect: (callback) => React.useEffect(callback, [callback]) }
    : undefined,
);
const {
  useRecommendationFlow,
} = require("../../../src/features/suggestions/hooks/useRecommendationFlow.ts");
const {
  mealSuggestionKeys,
} = require("../../../src/data/queries/mealSuggestionQueries.ts");

function retryServer(t, meal, { pause, loseResponse = false, fail = false } = {}) {
  let items = meal.foods.map((food, i) => ({ ...card(meal, food.id, String(901 + i)), can_regenerate: false, replacement_for_id: null }));
  const requests = [];
  let failure = fail;
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === `/api/v1/meals/${meal.id}`) return Response.json(meal);
    if (path === `/api/v1/meals/${meal.id}/suggestions` && init.method !== 'POST') {
      return Response.json(items);
    }
    const decision = path.match(/\/suggestions\/(\d+)\/decision$/);
    if (decision) {
      const item = items.find(entry => entry.id === decision[1]);
      assert.ok(item);
      const body = init.method === 'DELETE' ? { status: 'PENDING', dismiss_reasons: [] } : JSON.parse(init.body);
      Object.assign(item, body, { can_regenerate: body.status === 'DISMISSED' && !item.replacement_for_id
        && !items.some(entry => entry.replacement_for_id === item.id) });
      return Response.json(item);
    }
    assert.equal(path, `/api/v1/meals/${meal.id}/suggestions`);
    assert.equal(init.method, 'POST');
    const { targets } = JSON.parse(init.body);
    assert.equal(targets.length, 1);
    const id = targets[0].rejected_suggestion_id;
    assert.ok(id, 'Existing foods must not automatically regenerate');
    const item = items.find(entry => entry.id === id);
    assert.equal(targets[0].food_id, item.origin_food_id);
    requests.push(id);
    if (pause) await pause.promise;
    if (failure) { failure = false; return new Response('{"error_code":"GENERATION_FAILED"}', { status: 502 }); }
    const created = { ...card(meal, item.origin_food_id, String(1000 + requests.length)),
      can_regenerate: false, replacement_for_id: id };
    item.can_regenerate = false;
    items = [created, ...items];
    if (loseResponse) throw new Error('Response lost after server committed');
    return Response.json([created]);
  });
  return { requests };
}

test('추천을 거절하면 재생성·계속 선택을 기다리고 재생성 중 중복 요청과 다른 동작을 차단한다', async t => {
  const meal = mealWithFoods(2);
  const pause = deferred();
  const api = retryServer(t, meal, { pause });
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => h.current.items.length === 2);
  await act(async () => { await h.current.decide('dismissed', ['dislike']); });
  assert.equal(h.current.regenerationPrompt.id, '901');
  assert.equal(h.current.current, null);
  assert.equal(await h.current.decide('saved'), false);
  assert.equal(api.requests.length, 0);
  await act(async () => { assert.equal(h.current.continueAfterDismissal(), true); });
  assert.equal(h.current.current.id, '902');
  await act(async () => { await h.current.decide('dismissed', ['already_tried']); });
  assert.equal(h.current.current, null);
  assert.equal(h.current.regenerationPrompt.id, '902');
  assert.equal(api.requests.length, 0);
  let pending;
  await act(async () => {
    pending = h.current.regenerate('902');
    assert.equal(await h.current.regenerate('902'), false);
  });
  await waitFor(() => h.current.regeneratingId === '902' && h.current.busy);
  assert.equal(h.current.continueAfterDismissal(), false);
  assert.equal(await h.current.selectTargets([{ foodId: '1' }]), false);
  assert.equal(await h.current.undo(), false);
  await act(async () => { pause.resolve(); assert.equal(await pending, true); });
  assert.deepEqual(api.requests, ['902']);
  assert.equal(h.current.current.replacementForId, '902');
  assert.equal(h.current.current.foodId, '2');
  assert.equal(h.current.regenerationPrompt, null);
  await act(async () => { await h.current.decide('dismissed', ['dislike']); });
  assert.equal(h.current.regenerationPrompt, null);
  assert.equal(h.current.current, null);
  await act(async () => { await h.current.undo(); await h.current.refresh(); });
  assert.equal(h.current.items.find(item => item.id === '902').canRegenerate, false);
  assert.equal(api.requests.length, 1);
});

test('마지막 추천을 거절하고 계속하면 추가 생성 없이 종료하고 다시 들어오면 재생성 선택을 표시한다', async t => {
  const meal = mealWithFoods(1);
  const api = retryServer(t, meal);
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => h.current.current);
  await act(async () => { await h.current.decide('dismissed', ['dislike']); });
  assert.equal(h.current.regenerationPrompt.id, '901');
  await act(async () => { h.current.continueAfterDismissal(); });
  assert.equal(h.current.current, null);
  assert.equal(h.current.regenerationPrompt, null);
  assert.equal(api.requests.length, 0);
  const reopened = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => reopened.current.regenerationPrompt?.id === '901');
  assert.equal(api.requests.length, 0);
});

test('추천 재생성에 실패하면 거절 사유와 대상을 유지하고 재시도에 성공하면 같은 음식의 새 추천을 표시한다', async t => {
  const meal = mealWithFoods(1);
  const api = retryServer(t, meal, { fail: true });
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => h.current.current);
  await act(async () => { await h.current.decide('dismissed', ['dislike']); });
  await act(async () => { assert.equal(await h.current.regenerate('901'), false); });
  assert.equal(h.current.regenerationErrorId, '901');
  assert.equal(h.current.items.length, 1);
  assert.deepEqual(h.current.items[0].dismissReasons, ['dislike']);
  assert.equal(h.current.regenerationPrompt.id, '901');
  assert.equal(h.current.current, null);
  await act(async () => { assert.equal(await h.current.regenerate('901'), true); });
  assert.equal(h.current.regenerationErrorId, null);
  assert.equal(h.current.items.length, 2);
  assert.deepEqual(api.requests, ['901', '901']);
});

test('추천 재생성 응답을 잃어도 서버 조회로 결과를 복구하고 다시 들어오면 재생성된 추천을 표시한다', async t => {
  const meal = mealWithFoods(1);
  const api = retryServer(t, meal, { loseResponse: true });
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => h.current.current);
  await act(async () => { await h.current.decide('dismissed', ['dislike']); });
  await act(async () => { assert.equal(await h.current.regenerate('901'), true); });
  assert.equal(h.current.regenerationErrorId, null);
  assert.equal(h.current.regenerationPrompt, null);
  const reopened = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => reopened.current.items.length === 2);
  assert.equal(reopened.current.current.replacementForId, '901');
  assert.equal(reopened.current.regenerationPrompt, null);
  assert.equal(api.requests.length, 1);
});

test('추천 거절을 Undo하면 원래 카드를 복원하고 다시 거절해도 재생성 기회가 남아 있다', async t => {
  const meal = mealWithFoods(1);
  const api = retryServer(t, meal);
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => h.current.current);
  await act(async () => { await h.current.decide('dismissed', ['dislike']); });
  await act(async () => { await h.current.undo(); });
  assert.equal(h.current.current.id, '901');
  assert.deepEqual(h.current.current.dismissReasons, []);
  assert.equal(h.current.regenerationPrompt, null);
  await act(async () => { await h.current.decide('dismissed', ['already_tried']); });
  assert.equal(h.current.regenerationPrompt.id, '901');
  assert.equal(api.requests.length, 0);
});

test('추천 재생성 중 화면을 떠나면 늦은 응답은 원래 식사의 캐시만 갱신한다', async t => {
  const meal = mealWithFoods(1);
  const pause = deferred();
  retryServer(t, meal, { pause });
  let visible = true;
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id), {
    wrapper: child => visible ? child : null,
  });
  await waitFor(() => h.current.current);
  await act(async () => { await h.current.decide('dismissed', ['dislike']); });
  const otherKey = mealSuggestionKeys.all('2', '99');
  const otherItems = [{ id: 'other', foodId: '5', status: 'pending' }];
  h.client.setQueryData(otherKey, otherItems);
  let pending;
  await act(async () => { pending = h.current.regenerate('901'); });
  visible = false;
  await h.rerender();
  await act(async () => { pause.resolve(); await pending; });
  assert.deepEqual(h.client.getQueryData(otherKey), otherItems);
  assert.equal(h.client.getQueryData(mealSuggestionKeys.all('1', meal.id))[0].replacementForId, '901');
});

test('재생성한 음식에서 다른 음식으로 이동했다 돌아와도 기존 대체 추천을 재사용하고 생성 요청은 늘지 않는다', async t => {
  const meal = mealWithFoods(2);
  const api = retryServer(t, meal);
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => h.current.current);
  await act(async () => { assert.equal(await h.current.decide('dismissed', ['dislike']), true); });
  assert.equal(h.current.regenerationPrompt.id, '901');
  assert.equal(h.current.current, null);
  assert.deepEqual(api.requests, []);
  await act(async () => { assert.equal(await h.current.regenerate('901'), true); });
  const replacementId = h.current.current.id;
  assert.equal(h.current.current.replacementForId, '901');
  assert.deepEqual(api.requests, ['901']);

  await act(async () => { assert.equal(await h.current.selectTargets([{ foodId: '2' }]), true); });
  assert.equal(h.current.current.id, '902');
  await act(async () => { assert.equal(await h.current.decide('saved'), true); });
  await act(async () => { assert.equal(await h.current.selectTargets([{ foodId: '1' }]), true); });
  assert.equal(h.current.current.id, replacementId);
  assert.equal(h.current.current.replacementForId, '901');
  assert.equal(h.current.regenerationPrompt, null);
  await act(async () => { assert.equal(await h.current.selectTargets([{ foodId: '1' }, { foodId: '2' }]), true); });
  assert.equal(h.current.current.id, replacementId);
  assert.equal(h.current.items.find(item => item.id === '902').status, 'saved');
  assert.equal(h.current.items.find(item => item.id === '901').status, 'dismissed');
  assert.deepEqual(h.current.items.find(item => item.id === '901').dismissReasons, ['dislike']);
  assert.deepEqual(api.requests, ['901']);
});
