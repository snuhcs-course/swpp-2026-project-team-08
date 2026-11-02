// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Food-only targets, automatic generation, loading and retry boundaries

const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { React, act, renderHook, waitFor, deferred } = require('../helpers/react-harness.cjs');
require('../helpers/native-boundaries.cjs').nativeBoundaries(name => name === 'expo-router'
  ? { useFocusEffect: callback => React.useEffect(callback, [callback]) } : undefined);
const { QueryClient } = require('@tanstack/react-query');
const { useRecommendationFlow } = require('../../src/features/suggestions/hooks/useRecommendationFlow.ts');
const { mealKeys } = require('../../src/data/queries/mealQueries.ts');
const { mealSuggestionKeys } = require('../../src/data/queries/mealSuggestionQueries.ts');
const { toMealDetail } = require('../../src/data/dto/mealDto.ts');
const { mealResponse, reviewResponse } = require('../fixtures/server-meal.cjs');

function mealWithFoods(count) {
  const meal = mealResponse();
  meal.foods = Array.from({ length: count }, (_, index) => ({ ...mealResponse().foods[0], id: String(index + 1),
    name: `Food ${index + 1}`, ingredients: [{ id: String(101 + index), name: 'Carrot' }] }));
  const { meal: _record, ...review } = reviewResponse(meal, { after_photo_uri: null,
    food_results: meal.foods.map(food => ({ food_id: food.id, outcome: 'tasted', difficulties: [],
      ingredient_outcomes: [{ ingredient_id: food.ingredients[0].id, outcome: 'untouched', difficulties: [] }] })),
  });
  return { ...meal, review };
}

function card(meal, foodId, id, status = 'pending', ingredientId = null) {
  const { id: _id, meal_id: _mealId, ...food } = meal.foods.find(food => food.id === foodId);
  return { id, user_id: '1', meal_id: meal.id, food_id: foodId, ingredient_id: ingredientId,
    food_snapshot: food, what_to_try: 'Try a little', why_this_may_help: 'Try a different serving', serving_tip: null,
    status, dismiss_reasons: [], saved_at: status === 'saved' ? '2026-11-02T00:00:00Z' : null,
    created_at: '2026-11-02T00:00:00Z' };
}

function server(t, meal, { existing = [], beforeList, generate } = {}) {
  let items = existing;
  const posts = [];
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === `/api/v1/meals/${meal.id}`) return new Response(JSON.stringify(meal));
    assert.equal(path, `/api/v1/meals/${meal.id}/suggestions`);
    if (init.method !== 'POST') {
      if (beforeList) await beforeList();
      return new Response(JSON.stringify(items));
    }
    const targets = JSON.parse(init.body).targets;
    assert.ok(targets.every(target => target.ingredient_id === null));
    posts.push(targets);
    const created = targets.map((target, index) => card(meal, target.food_id, String(1000 + posts.length * 10 + index)));
    if (generate) {
      const override = await generate({ created, posts, setItems: next => { items = next; }, items });
      if (override) return override;
    }
    items = [...created, ...items];
    return new Response(JSON.stringify(created));
  });
  return { posts };
}

for (const count of [1, 2, 3]) {
  test(`${count} food items automatically generate food cards once, including with tracked ingredients`, async t => {
    const meal = mealWithFoods(count);
    const { posts } = server(t, meal);
    const h = await renderHook(t, () => useRecommendationFlow('1', meal.id), { wrapper: child => React.createElement(React.StrictMode, null, child) });
    await waitFor(() => h.current.items.length === count && !h.current.generating);
    assert.equal(posts.length, 1);
    assert.deepEqual(posts[0], meal.foods.map(food => ({ food_id: food.id, ingredient_id: null })));
    assert.equal(h.current.visibleTargets.length, count);
    assert.ok(h.current.targetOptions.every(option => option.target.ingredientId === null));
    await h.rerender();
    await act(async () => { await h.current.refresh(); });
    assert.equal(posts.length, 1);
  });
}

for (const [name, count, reviewed] of [['empty meal', 0, true], ['four foods', 4, true], ['unreviewed meal', 2, false]]) {
  test(`${name} does not automatically generate`, async t => {
    const meal = mealWithFoods(count);
    if (!reviewed) meal.review = null;
    const { posts } = server(t, meal);
    const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
    await waitFor(() => h.current.source.isSuccess && h.current.suggestions.isSuccess);
    assert.equal(posts.length, 0);
    assert.equal(h.current.generating, false);
    if (count === 4) {
      const targets = h.current.targetOptions.map(option => option.target);
      await act(async () => {
        assert.equal(await h.current.selectTargets(targets), false);
        assert.equal(await h.current.selectTargets([{ foodId: '1', ingredientId: '101' }]), false);
        assert.equal(await h.current.selectTargets([targets[0], targets[0]]), false);
        assert.equal(await h.current.selectTargets(targets.slice(0, 3)), true);
      });
      assert.equal(posts.length, 1);
      assert.equal(h.current.items.length, 3);
    }
  });
}

test('waits for existing cards before generating and preserves saved/dismissed food cards', async t => {
  const meal = mealWithFoods(3);
  const listed = deferred();
  const existing = [card(meal, '1', '901', 'saved'), card(meal, '2', '902', 'dismissed'), card(meal, '3', '903', 'pending', '103')];
  const { posts } = server(t, meal, { existing, beforeList: () => listed.promise });
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => h.current.source.isSuccess);
  assert.equal(posts.length, 0);
  await act(async () => listed.resolve());
  await waitFor(() => h.current.items.length === 3 && !h.current.generating);
  assert.deepEqual(posts, [[{ food_id: '3', ingredient_id: null }]]);
  assert.equal(h.current.current.foodId, '3');
  assert.equal(h.current.current.ingredientId, null);
  assert.deepEqual(h.current.items.filter(item => item.status !== 'pending').map(item => item.id), ['901', '902']);
  assert.equal(h.current.visibleTargets.length, 3);
});

test('cached targets wait for the focus refresh and do not regenerate existing cards', async t => {
  const meal = mealWithFoods(1);
  const listed = deferred();
  const { posts } = server(t, meal, { existing: [card(meal, '1', '901', 'saved')], beforeList: () => listed.promise });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } });
  client.setQueryData(mealKeys.detail('1', meal.id), toMealDetail(meal));
  client.setQueryData(mealSuggestionKeys.all('1', meal.id), []);
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id), { client });
  assert.equal(posts.length, 0);
  await act(async () => listed.resolve());
  await waitFor(() => h.current.items.length === 1 && !h.current.generating);
  assert.equal(posts.length, 0);
});

test('failed automatic generation retains all targets for explicit retry without looping', async t => {
  const meal = mealWithFoods(2);
  const { posts } = server(t, meal, { generate: ({ posts }) => posts.length === 1
    ? new Response('{"error_code":"GENERATION_FAILED"}', { status: 502 }) : undefined });
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => h.current.generationFailed && !h.current.generating);
  await h.rerender();
  assert.equal(posts.length, 1);
  assert.equal(h.current.visibleTargets.length, 2);
  await act(async () => { assert.equal(await h.current.selectTargets(h.current.visibleTargets), true); });
  assert.equal(posts.length, 2);
  assert.equal(h.current.items.length, 2);
  assert.equal(h.current.generationFailed, false);
});

test('a partial server result retries only the missing food card', async t => {
  const meal = mealWithFoods(2);
  const { posts } = server(t, meal, { generate: ({ posts, created, setItems }) => {
    if (posts.length !== 1) return;
    setItems([created[0]]);
    return new Response(JSON.stringify([created[0]]));
  } });
  const h = await renderHook(t, () => useRecommendationFlow('1', meal.id));
  await waitFor(() => h.current.generationFailed && !h.current.generating);
  assert.equal(h.current.items.length, 1);
  await act(async () => { assert.equal(await h.current.selectTargets(h.current.visibleTargets), true); });
  assert.deepEqual(posts[1], [{ food_id: '2', ingredient_id: null }]);
  assert.equal(h.current.items.length, 2);
});
