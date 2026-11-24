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
// Changed: 추천 생성 대상·중복 방지·실패 복구 검증 분리
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
const { QueryClient } = require("@tanstack/react-query");
const {
  useRecommendationFlow,
} = require("../../../src/features/suggestions/hooks/useRecommendationFlow.ts");
const { mealKeys } = require("../../../src/data/queries/mealQueries.ts");
const {
  mealSuggestionKeys,
} = require("../../../src/data/queries/mealSuggestionQueries.ts");
const { toMealDetail } = require("../../../src/data/dto/mealDto.ts");

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
  test(`재료별 결과가 있는 음식 ${count}개는 음식별 추천을 한 번만 생성하고 재조회해도 중복 생성하지 않는다`, async (t) => {
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
  ["음식이 없는 식사", 0, true],
  ["음식이 네 개인 식사", 4, true],
  ["검토 전 식사", 2, false],
]) {
  test(`${name}에서는 추천을 자동 생성하지 않는다`, async (t) => {
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

test("기존 추천 조회 후 추천이 없는 음식만 생성하고 저장·거절한 카드는 유지한다", async (t) => {
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

test("캐시가 있어도 화면 진입 재조회를 기다리며 서버에 기존 추천이 있으면 다시 생성하지 않는다", async (t) => {
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

test("자동 추천 생성 실패 후 대상을 유지하고 자동 반복 없이 재시도 요청에만 추천을 생성한다", async (t) => {
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

test("일부 음식의 추천만 응답받으면 재시도는 누락된 음식에 대해서만 요청한다", async (t) => {
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

test("추천 대상을 변경했다가 되돌리면 기존 카드를 재사용하고 생성 요청을 반복하지 않는다", async (t) => {
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

test("추천 대상을 추가하면 기존 카드는 재사용하고 추천이 없는 음식만 생성한다", async (t) => {
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

test('모든 음식의 결과가 Eaten이면 추천을 생성하지 않고 기존 추천도 표시하지 않는다', async t => {
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

test('일부 음식이 Eaten이면 나머지 음식만 추천을 생성하고 Eaten 음식의 기존 추천은 숨긴다', async t => {
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
