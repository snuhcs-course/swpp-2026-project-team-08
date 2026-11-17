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

const { test } = require("node:test");
const assert = require("node:assert/strict");
require("../helpers/register.cjs");
const {
  React,
  act,
  renderHook,
  waitFor,
  deferred,
} = require("../helpers/react-harness.cjs");
require("../helpers/native-boundaries.cjs").nativeBoundaries((name) =>
  name === "expo-router"
    ? { useFocusEffect: (callback) => React.useEffect(callback, [callback]) }
    : undefined,
);
const { QueryClient } = require("@tanstack/react-query");
const {
  useRecommendationFlow,
} = require("../../src/features/suggestions/hooks/useRecommendationFlow.ts");
const { mealKeys } = require("../../src/data/queries/mealQueries.ts");
const {
  mealSuggestionKeys,
} = require("../../src/data/queries/mealSuggestionQueries.ts");
const { toMealDetail } = require("../../src/data/dto/mealDto.ts");
const { mealResponse, reviewResponse } = require("../fixtures/server-meal.cjs");
const { suggestionResponse } = require("../fixtures/server-suggestion.cjs");

// 서버는 리뷰 결과를 음식·재료 안에 담아 돌려준다. 리뷰가 있는 식사 상세를 만든다.
function mealWithFoods(count, reviewed = true) {
  const meal = mealResponse();
  meal.foods = Array.from({ length: count }, (_, index) => ({
    ...mealResponse().foods[0],
    id: String(index + 1),
    name: `Food ${index + 1}`,
    ingredients: [
      {
        id: String(101 + index),
        name: "Carrot",
        outcome: null,
        difficulty_reasons: [],
      },
    ],
  }));
  if (!count || !reviewed) return meal;
  return reviewResponse(meal, {
    after_photo_uri: null,
    food_results: meal.foods.map((food) => ({
      food_id: food.id,
      outcome: "TASTED",
      difficulty_reasons: [],
      ingredient_outcomes: [
        {
          ingredient_id: food.ingredients[0].id,
          outcome: "UNTOUCHED",
          difficulty_reasons: [],
        },
      ],
    })),
  });
}

function card(meal, foodId, id, status = "PENDING") {
  return suggestionResponse({
    id,
    meal_id: meal.id,
    origin_food_id: foodId,
    status,
    saved_at: status === "SAVED" ? "2026-11-02T00:00:00Z" : null,
    created_at: "2026-11-02T00:00:00Z",
  });
}

function server(t, meal, { existing = [], beforeList, generate } = {}) {
  let items = existing;
  const posts = [];
  t.mock.method(global, "fetch", async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === `/api/v1/meals/${meal.id}`)
      return new Response(JSON.stringify(meal));
    assert.equal(path, `/api/v1/meals/${meal.id}/suggestions`);
    if (init.method !== "POST") {
      if (beforeList) await beforeList();
      return new Response(JSON.stringify(items));
    }
    const targets = JSON.parse(init.body).targets;
    // 추천 대상은 음식뿐이라 요청에 재료 필드가 없다.
    assert.ok(
      targets.every((target) => Object.keys(target).join() === "food_id"),
    );
    posts.push(targets);
    const created = targets.map((target, index) =>
      card(meal, target.food_id, String(1000 + posts.length * 10 + index)),
    );
    if (generate) {
      const override = await generate({
        created,
        posts,
        setItems: (next) => {
          items = next;
        },
        items,
      });
      if (override) return override;
    }
    items = [...created, ...items];
    return new Response(JSON.stringify(created));
  });
  return { posts };
}

for (const count of [1, 2, 3]) {
  test(`${count} food items automatically generate food cards once, including with tracked ingredients`, async (t) => {
    const meal = mealWithFoods(count);
    const { posts } = server(t, meal);
    const h = await renderHook(t, () => useRecommendationFlow("1", meal.id), {
      wrapper: (child) => React.createElement(React.StrictMode, null, child),
    });
    await waitFor(
      () => h.current.items.length === count && !h.current.generating,
    );
    assert.equal(posts.length, 1);
    assert.deepEqual(
      posts[0],
      meal.foods.map((food) => ({ food_id: food.id })),
    );
    assert.equal(h.current.visibleTargets.length, count);
    assert.ok(
      h.current.targetOptions.every(
        (option) => !("ingredientId" in option.target),
      ),
    );
    await h.rerender();
    await act(async () => {
      await h.current.refresh();
    });
    assert.equal(posts.length, 1);
  });
}

for (const [name, count, reviewed] of [
  ["empty meal", 0, true],
  ["four foods", 4, true],
  ["unreviewed meal", 2, false],
]) {
  test(`${name} does not automatically generate`, async (t) => {
    const meal = mealWithFoods(count, reviewed);
    const { posts } = server(t, meal);
    const h = await renderHook(t, () => useRecommendationFlow("1", meal.id));
    await waitFor(
      () => h.current.source.isSuccess && h.current.suggestions.isSuccess,
    );
    assert.equal(posts.length, 0);
    assert.equal(h.current.generating, false);
    if (count === 4) {
      const targets = h.current.targetOptions.map((option) => option.target);
      await act(async () => {
        assert.equal(await h.current.selectTargets(targets), false);
        assert.equal(await h.current.selectTargets([{ foodId: "999" }]), false);
        assert.equal(
          await h.current.selectTargets([targets[0], targets[0]]),
          false,
        );
        assert.equal(await h.current.selectTargets(targets.slice(0, 3)), true);
      });
      assert.equal(posts.length, 1);
      assert.equal(h.current.items.length, 3);
    }
  });
}

test("waits for existing cards before generating and preserves saved/dismissed food cards", async (t) => {
  const meal = mealWithFoods(3);
  const listed = deferred();
  // 음식 1·2는 이미 카드가 있고 음식 3만 카드가 없다.
  const existing = [
    card(meal, "1", "901", "SAVED"),
    card(meal, "2", "902", "DISMISSED"),
  ];
  const { posts } = server(t, meal, {
    existing,
    beforeList: () => listed.promise,
  });
  const h = await renderHook(t, () => useRecommendationFlow("1", meal.id));
  await waitFor(() => h.current.source.isSuccess);
  assert.equal(posts.length, 0);
  await act(async () => listed.resolve());
  await waitFor(() => h.current.items.length === 3 && !h.current.generating);
  assert.deepEqual(posts, [[{ food_id: "3" }]]);
  assert.equal(h.current.current.foodId, "3");
  assert.deepEqual(
    h.current.items
      .filter((item) => item.status !== "pending")
      .map((item) => item.id),
    ["901", "902"],
  );
  assert.equal(h.current.visibleTargets.length, 3);
});

test("cached targets wait for the focus refresh and do not regenerate existing cards", async (t) => {
  const meal = mealWithFoods(1);
  const listed = deferred();
  const { posts } = server(t, meal, {
    existing: [card(meal, "1", "901", "SAVED")],
    beforeList: () => listed.promise,
  });
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });
  client.setQueryData(mealKeys.detail("1", meal.id), toMealDetail(meal));
  client.setQueryData(mealSuggestionKeys.all("1", meal.id), []);
  const h = await renderHook(t, () => useRecommendationFlow("1", meal.id), {
    client,
  });
  assert.equal(posts.length, 0);
  await act(async () => listed.resolve());
  await waitFor(() => h.current.items.length === 1 && !h.current.generating);
  assert.equal(posts.length, 0);
});

test("failed automatic generation retains all targets for explicit retry without looping", async (t) => {
  const meal = mealWithFoods(2);
  const { posts } = server(t, meal, {
    generate: ({ posts }) =>
      posts.length === 1
        ? new Response('{"error_code":"GENERATION_FAILED"}', { status: 502 })
        : undefined,
  });
  const h = await renderHook(t, () => useRecommendationFlow("1", meal.id));
  await waitFor(() => h.current.generationFailed && !h.current.generating);
  await h.rerender();
  assert.equal(posts.length, 1);
  assert.equal(h.current.visibleTargets.length, 2);
  await act(async () => {
    assert.equal(await h.current.selectTargets(h.current.visibleTargets), true);
  });
  assert.equal(posts.length, 2);
  assert.equal(h.current.items.length, 2);
  assert.equal(h.current.generationFailed, false);
});

test("a partial server result retries only the missing food card", async (t) => {
  const meal = mealWithFoods(2);
  const { posts } = server(t, meal, {
    generate: ({ posts, created, setItems }) => {
      if (posts.length !== 1) return;
      setItems([created[0]]);
      return new Response(JSON.stringify([created[0]]));
    },
  });
  const h = await renderHook(t, () => useRecommendationFlow("1", meal.id));
  await waitFor(() => h.current.generationFailed && !h.current.generating);
  assert.equal(h.current.items.length, 1);
  await act(async () => {
    assert.equal(await h.current.selectTargets(h.current.visibleTargets), true);
  });
  assert.deepEqual(posts[1], [{ food_id: "2" }]);
  assert.equal(h.current.items.length, 2);
});

test("automatic targets can be changed to existing cards without generating duplicates", async (t) => {
  const meal = mealWithFoods(3);
  const { posts } = server(t, meal);
  const h = await renderHook(t, () => useRecommendationFlow("1", meal.id));
  await waitFor(() => h.current.items.length === 3 && !h.current.generating);
  const originalIds = h.current.items.map((item) => item.id);
  const targets = h.current.targetOptions.map((option) => option.target);
  assert.equal(h.current.availableTargets.length, 0);
  await act(async () => {
    assert.equal(await h.current.selectTargets([targets[1]]), true);
  });
  assert.deepEqual(h.current.visibleTargets, [targets[1]]);
  assert.deepEqual(
    h.current.items.map((item) => item.foodId),
    ["2"],
  );
  assert.equal(h.current.current.foodId, "2");
  await act(async () => {
    assert.equal(await h.current.selectTargets(targets), true);
  });
  assert.deepEqual(
    h.current.items.map((item) => item.id),
    originalIds,
  );
  assert.equal(h.current.visibleTargets.length, 3);
  assert.equal(posts.length, 1);
});

test("adding a new target reuses an existing card and only generates the missing card", async (t) => {
  const meal = mealWithFoods(4);
  const { posts } = server(t, meal, {
    existing: [card(meal, "1", "901"), card(meal, "2", "902")],
  });
  const h = await renderHook(t, () => useRecommendationFlow("1", meal.id));
  await waitFor(
    () => h.current.suggestions.isSuccess && h.current.source.isSuccess,
  );
  await act(async () => {
    assert.equal(
      await h.current.selectTargets([
        { foodId: "2", ingredientId: null },
        { foodId: "3", ingredientId: null },
      ]),
      true,
    );
  });
  assert.deepEqual(posts, [[{ food_id: "3" }]]);
  assert.deepEqual(h.current.items.map((item) => item.foodId).sort(), [
    "2",
    "3",
  ]);
  assert.equal(h.current.items.find((item) => item.foodId === "2").id, "902");
  await act(async () => {
    assert.equal(
      await h.current.selectTargets([{ foodId: "1", ingredientId: null }]),
      true,
    );
  });
  assert.equal(h.current.current.id, "901");
  assert.equal(posts.length, 1);
});

test('all-eaten meals never generate recommendations or show old cards', async t => {
  const meal = mealWithFoods(2);
  for (const food of meal.foods) food.outcome = 'EATEN';
  const api = server(t, meal, { existing: [card(meal, '1', '900')] });
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => h.current.source.isSuccess && h.current.suggestions.isSuccess);
  assert.deepEqual(h.current.targetOptions, []);
  assert.deepEqual(h.current.items, []);
  assert.equal(await h.current.selectTargets([{ foodId: '1' }]), false);
  assert.deepEqual(api.posts, []);
});

test('mixed meals generate only non-eaten foods and hide existing eaten cards', async t => {
  const meal = mealWithFoods(4);
  meal.foods[0].outcome = 'EATEN';
  meal.foods[1].outcome = 'EATEN';
  const { posts } = server(t, meal, { existing: [card(meal, '1', '901')] });
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => h.current.items.length === 2 && !h.current.generating);
  assert.deepEqual(h.current.targetOptions.map(x => x.target.foodId), ['3', '4']);
  assert.deepEqual(posts, [[{ food_id: '3' }, { food_id: '4' }]]);
  assert.deepEqual(h.current.items.map(x => x.foodId), ['3', '4']);
});

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

// The confirmed dismissal is now a choice step before the next card/completion.
test('each dismissal pauses for regeneration or continue, including the last card', async t => {
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

test('continue after the last dismissal completes without generation and reentry restores the choice', async t => {
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

test('failed optional generation preserves choices and explicitly retries the same food', async t => {
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

test('a lost optional generation response is recovered from the server and survives reentry', async t => {
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

test('Undo restores the first card without spending the optional generation opportunity', async t => {
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

test('a late optional generation updates only its original meal cache', async t => {
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


test('target reselection reuses the manually regenerated card without another generation request', async t => {
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
