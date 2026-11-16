// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Ingredient difficulty autosave, food editing, failure and server restoration
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 리뷰 요청의 대문자 outcome 과 식사 상세 응답 기준으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 재료 난이도 테스트를 서버 난이도 값과 식사 상세 응답 기준으로 수정
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: Add 없이 입력한 음식·재료 사유의 저장 실패·재시도·복원 검증
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 음식 편집에서 저장 추천 연결 및 Record a Try 미리 채움 검증
// AI-generated with GPT-6, 2026-11-13, reviewed by Haechan Jung
// Changed: 편집 추천의 저장·취소·복원과 자동 연결 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../helpers/react-harness.cjs');
let pickPhoto;
const { values, failNextWrite } = require('../helpers/native-boundaries.cjs').nativeBoundaries(name => {
  if (name.endsWith('/mealPhotoPicker')) return {
    pickMealPhoto: (...args) => pickPhoto(...args), PhotoError: class PhotoError extends Error {},
  };
});
const { mealResponse, reviewResponse } = require('../fixtures/server-meal.cjs');
const { toMealDetail } = require('../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../src/data/dto/mealLegacyDto.ts');
const { newDraft } = require('../../src/features/meal-checkin/rules.ts');
const { newFood } = require('../../src/rules/foodDraft.ts');
const { saveMeal, saveMealDraft, readMealDraft } = require('../../src/data/storage/mealStorage.ts');
const { readHomeMeals } = require('../../src/data/storage/homeMealStorage.ts');
const { readAfterMealDraft, readAfterMealReview, saveAfterMealDraft } = require('../../src/data/storage/afterMealReviewStorage.ts');
const { newReviewDraft, reviewFromDraft, setOutcome } = require('../../src/features/after-meal-review/rules.ts');
const { afterMealKeys, useSaveAfterMealReview } = require('../../src/data/queries/afterMealReviewQueries.ts');
const { useMealList } = require('../../src/data/queries/mealLogQueries.ts');
const { mealKeys, mealLogKeys } = require('../../src/data/queries/mealQueryKeys.ts');
const { checkinReferenceKeys } = require('../../src/data/queries/checkinReferenceQueries.ts');
const { useAfterMealReview } = require('../../src/features/after-meal-review/hooks/useAfterMealReview.ts');
const { useMealCheckin } = require('../../src/features/meal-checkin/hooks/useMealCheckin.ts');

beforeEach(t => {
  values.clear();
  t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected HTTP request'); });
});

test('complete difficulty inputs save without Add and survive a failed request and retry', async t => {
  let serverMeal = mealResponse();
  serverMeal.foods[0].ingredients = [{ id: '101', name: 'Carrot' }];
  const requests = [];
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/v1/meals/10' && !init.method) return Response.json(serverMeal);
    assert.equal(path, '/api/v1/meals/10/review');
    assert.equal(init.method, 'PUT');
    const body = JSON.parse(init.body);
    requests.push(body);
    if (requests.length === 1) return Response.json({ error_code: 'UNAVAILABLE' }, { status: 503 });
    serverMeal = reviewResponse(serverMeal, body);
    return Response.json(serverMeal);
  });
  const profile = { id: '1' };
  const h = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => h.current.draft !== null);
  const ingredient = h.current.draft.outcomes[0].ingredients[0].id;
  await act(async () => {
    h.current.chooseOutcome('1', 'tasted');
    h.current.chooseOutcome('1', 'untouched', ingredient);
    h.current.setDifficultyInput('1', { category: 'texture', subcategory: 'hardness', value: 'firm', note: '' });
    h.current.setDifficultyInput(ingredient, { category: 'smell', value: 'mint', note: '' });
    h.current.go('difficulties');
  });
  const inputs = structuredClone(h.current.draft.difficultyInputs);
  await act(async () => assert.equal(await h.current.finish(), false));
  assert.deepEqual(h.current.draft.difficultyInputs, inputs);
  assert.deepEqual((await readAfterMealDraft('1', '10')).difficultyInputs, inputs);
  await act(async () => assert.equal(await h.current.finish(), true));
  assert.deepEqual(requests[1], requests[0]);
  assert.deepEqual(requests[1].food_results[0].difficulty_reasons, ['TEXTURE.HARDNESS.FIRM']);
  assert.deepEqual(requests[1].food_results[0].ingredient_outcomes[0].difficulty_reasons, ['SMELL.MINT']);
  assert.deepEqual(h.current.draft.difficultyInputs, {});
  assert.equal(h.current.draft.difficulties['1'][0].value, 'firm');
  assert.equal(h.current.draft.difficulties[ingredient][0].value, 'mint');
  const restored = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => restored.current.draft !== null);
  assert.equal(restored.current.draft.difficulties['1'][0].subcategory, 'hardness');
  assert.equal(restored.current.draft.difficulties[ingredient][0].value, 'mint');
});

test('failed review preserves the draft; retry updates storage, detail cache, and the Home observer', async (t) => {
  const response = mealResponse();
  const detail = toMealDetail(response);
  const meal = toLegacyMeal(detail);
  await saveMeal(meal);
  const draft = { ...newReviewDraft(meal), step: 'difficulties' };
  draft.outcomes = setOutcome(draft.outcomes, '1', 'tasted');
  await saveAfterMealDraft(draft);
  const review = reviewFromDraft(draft, meal);
  let fails = true;
  let requests = 0;
  let listRequests = 0;
  let serverMeal = response;
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    if (new URL(url).pathname === '/api/v1/meals' && !init.method) {
      listRequests++;
      return new Response(JSON.stringify([serverMeal]));
    }
    assert.equal(new URL(url).pathname, '/api/v1/meals/10/review');
    assert.equal(init.method, 'PUT');
    const body = JSON.parse(init.body);
    assert.equal(body.food_results[0].outcome, 'TASTED');
    requests++;
    if (!fails) serverMeal = reviewResponse(response, body);
    return new Response(JSON.stringify(fails ? { error_code: 'UNAVAILABLE' } : reviewResponse(response, body)),
      { status: fails ? 503 : 200 });
  });
  const harness = await renderHook(t, () => ({ mutation: useSaveAfterMealReview(), home: useMealList('1', null) }));
  await waitFor(() => harness.current.home.isSuccess);
  assert.equal(harness.current.home.data[0].review, null);
  const staleKeys = [mealLogKeys.all('1'), checkinReferenceKeys.meals('1'), ['suggestions', '1']];
  harness.client.setQueryData(mealKeys.detail('1', '10'), detail);
  for (const key of staleKeys) harness.client.setQueryData(key, []);
  await act(async () => {
    await assert.rejects(harness.current.mutation.mutateAsync({ review, detail }), /UNAVAILABLE/);
  });
  assert.equal(requests, 1);
  assert.equal(await readAfterMealReview('1', '10'), null);
  assert.equal((await readAfterMealDraft('1', '10')).step, 'difficulties');
  assert.equal(harness.client.getQueryData(mealKeys.detail('1', '10')).review, null);
  assert.equal(harness.current.home.data[0].review, null);
  for (const key of staleKeys) assert.equal(harness.client.getQueryState(key).isInvalidated, false);
  fails = false;
  await act(async () => { await harness.current.mutation.mutateAsync({ review, detail }); });
  await waitFor(() => harness.current.home.data[0].review?.foodResults[0].outcome === 'tasted');
  assert.equal(listRequests, 2);
  assert.equal(requests, 2);
  assert.equal((await readHomeMeals('1'))[0].reviewed, true);
  assert.equal((await readAfterMealDraft('1', '10')).step, 'complete');
  assert.equal(harness.client.getQueryData(afterMealKeys.draft('1', '10')).step, 'complete');
  assert.deepEqual(harness.client.getQueryData(afterMealKeys.result('1', '10')), review);
  assert.equal(harness.client.getQueryData(mealKeys.detail('1', '10')).review.foodResults[0].outcome, 'tasted');
  for (const key of staleKeys) assert.equal(harness.client.getQueryState(key).isInvalidated, true);
  assert.equal(harness.client.getQueryState(mealLogKeys.list('1', null)).isInvalidated, false);
});

test('skipping a delayed photo preserves answers and ignores the stale selection', async (t) => {
  const response = mealResponse();
  t.mock.method(global, 'fetch', async url => {
    assert.equal(new URL(url).pathname, '/api/v1/meals/10');
    return new Response(JSON.stringify(response));
  });
  const profile = { id: '1' };
  const harness = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => harness.current.draft !== null);
  const old = deferred(), next = deferred();
  pickPhoto = () => old.promise;
  let oldPick, newPick;
  await act(async () => { oldPick = harness.current.pick('gallery'); });
  await act(async () => { harness.current.manual(); harness.current.chooseOutcome('1', 'eaten'); });
  assert.equal(harness.current.draft.step, 'outcomes');
  pickPhoto = () => next.promise;
  await act(async () => { newPick = harness.current.pick('gallery'); });
  await act(async () => { old.resolve({ id: 'old', uri: 'file:///old.png', mimeType: 'image/png' }); await oldPick; });
  assert.equal(harness.current.draft.afterPhoto, null);
  assert.equal(harness.current.draft.outcomes[0].decision.confirmed, 'eaten');
  assert.equal(harness.current.picking, true);
  await act(async () => { next.resolve({ id: 'new', uri: 'file:///new.png', mimeType: 'image/png' }); await newPick; });
  assert.equal(harness.current.draft.afterPhoto.id, 'new');
  assert.equal(harness.current.picking, false);
});

async function linkingHarness(t) {
  const firstFood = { ...newFood(), confirmed: true, id: 'rice', name: 'Rice' };
  const secondFood = { ...newFood(), confirmed: true, id: 'soup', name: 'Soup' };
  const draft = { ...newDraft('1'), step: 'foods', mealType: 'lunch', setting: 'home', foods: [firstFood, secondFood] };
  await saveMealDraft(draft);
  const suggestion = { id: '31', title: 'Try less', description: 'Keep it separate', servingTip: 'No pressure' };
  const harness = await renderHook(t, suggestions => useMealCheckin('1', undefined, false, suggestions), { props: [suggestion] });
  await waitFor(() => harness.current.draft !== null);
  const link = async (foodId) => {
    const food = harness.current.draft.foods.find((item) => item.id === foodId);
    await act(async () => harness.current.edit(food));
    await act(async () => harness.current.suggestionLinking.onOpenPicker());
    await act(async () => harness.current.suggestionLinking.onSelectSuggestion('31'));
    await act(async () => harness.current.suggestionLinking.onLink(foodId));
  };
  return { harness, link, firstFood };
}

test('cancelling suggestion linking leaves the saved draft unchanged', async (t) => {
  const { harness } = await linkingHarness(t);
  await act(async () => harness.current.edit(harness.current.draft.foods[0]));
  await act(async () => harness.current.suggestionLinking.onOpenPicker());
  await act(async () => harness.current.suggestionLinking.onSelectSuggestion('31'));
  await act(async () => harness.current.suggestionLinking.onClosePicker());
  assert.equal(harness.current.suggestionLinking.pickerOpen, false);
  await act(async () => harness.current.cancelEdit());
  assert.deepEqual((await readMealDraft('1')).suggestionLinks ?? [], []);
  await act(async () => harness.current.edit());
  assert.equal(harness.current.draft.editingSuggestionLink, null);
});

test('linking from the food editor persists the edited food and snapshot', async (t) => {
  const { harness, firstFood } = await linkingHarness(t);
  await act(async () => harness.current.edit(firstFood));
  await act(async () => harness.current.changeFood({ name: 'Edited rice' }));
  await act(async () => harness.current.suggestionLinking.onOpenPicker());
  await act(async () => harness.current.suggestionLinking.onSelectSuggestion('31'));
  await act(async () => harness.current.suggestionLinking.onLink('rice'));
  const pending = await readMealDraft('1');
  assert.equal(pending.foods[0].name, 'Rice');
  assert.deepEqual(pending.suggestionLinks ?? [], []);
  assert.equal(pending.editingSuggestionLink.foodId, 'rice');
  await act(async () => harness.current.saveFood());
  await act(async () => { await harness.current.flush(); });
  const restored = await readMealDraft('1');
  assert.equal(restored.foods[0].name, 'Edited rice');
  assert.deepEqual(restored.suggestionLinks, [{ suggestionId: '31', foodId: 'rice',
    title: 'Try less', description: 'Keep it separate', servingTip: 'No pressure' }]);
  assert.deepEqual(harness.client.getQueryData(mealKeys.draft('1')).suggestionLinks,
    restored.suggestionLinks);
});

test('relinking replaces the previous target only on Save food; card unlink persists removal', async (t) => {
  const { harness, link } = await linkingHarness(t);
  await link('rice');
  await act(async () => harness.current.saveFood());
  await link('soup');
  assert.equal(harness.current.draft.suggestionLinks[0].foodId, 'rice');
  assert.equal((await readMealDraft('1')).editingSuggestionLink.foodId, 'soup');
  await act(async () => harness.current.saveFood());
  assert.equal(harness.current.draft.suggestionLinks.length, 1);
  assert.equal(harness.current.draft.suggestionLinks[0].foodId, 'soup');
  await act(async () => harness.current.suggestionLinking.onUnlink('31'));
  await act(async () => { await harness.current.flush(); });
  assert.deepEqual((await readMealDraft('1')).suggestionLinks, []);
});

test('cancelling a new food drops its pending suggestion link', async (t) => {
  const { harness } = await linkingHarness(t);
  await act(async () => harness.current.edit());
  const foodId = harness.current.draft.editingFood.id;
  await act(async () => harness.current.suggestionLinking.onOpenPicker());
  await act(async () => harness.current.suggestionLinking.onSelectSuggestion('31'));
  await act(async () => harness.current.suggestionLinking.onLink(foodId));
  assert.equal(harness.current.draft.editingSuggestionLink.foodId, foodId);
  assert.deepEqual(harness.current.draft.suggestionLinks ?? [], []);
  await act(async () => harness.current.cancelEdit());
  await act(async () => { await harness.current.flush(); });
  assert.deepEqual((await readMealDraft('1')).suggestionLinks ?? [], []);
  assert.equal((await readMealDraft('1')).editingSuggestionLink, null);
});

test('recording a try prefills the new food editor with that suggestion', async (t) => {
  const draft = { ...newDraft('1'), step: 'foods', mealType: 'lunch', setting: 'home', foods: [] };
  await saveMealDraft(draft);
  const suggestion = { id: '31', title: 'Try less', description: 'Keep it separate', servingTip: 'No pressure' };
  const harness = await renderHook(t, suggestions => useMealCheckin('1', undefined, false, suggestions, '31'), { props: [suggestion] });
  await waitFor(() => harness.current.draft !== null);
  await act(async () => harness.current.edit());
  assert.deepEqual(harness.current.draft.suggestionLinks ?? [], []);
  assert.deepEqual(harness.current.draft.editingSuggestionLink, {
    suggestionId: '31',
    foodId: harness.current.draft.editingFood.id,
    title: 'Try less',
    description: 'Keep it separate',
    servingTip: 'No pressure',
  });
  assert.deepEqual((await readMealDraft('1')).editingSuggestionLink,
    harness.current.draft.editingSuggestionLink);
});

test('recording a try waits for saved suggestions then prefills the new food', async (t) => {
  const draft = { ...newDraft('1'), step: 'foods', mealType: 'lunch', setting: 'home', foods: [] };
  await saveMealDraft(draft);
  const suggestion = { id: '31', title: 'Try less', description: 'Keep it separate', servingTip: 'No pressure' };
  const harness = await renderHook(t, suggestions => useMealCheckin('1', undefined, false, suggestions, '31'), { props: [] });
  await waitFor(() => harness.current.draft !== null);
  await act(async () => harness.current.edit());
  assert.deepEqual(harness.current.draft.suggestionLinks ?? [], []);
  await act(async () => { await harness.rerender([suggestion]); });
  assert.equal(harness.current.draft.editingSuggestionLink.suggestionId, '31');
  assert.equal(harness.current.draft.editingSuggestionLink.foodId, harness.current.draft.editingFood.id);
  assert.deepEqual(harness.current.draft.suggestionLinks ?? [], []);
});

test('a second new food does not take a recorded try already linked', async (t) => {
  const draft = { ...newDraft('1'), step: 'foods', mealType: 'lunch', setting: 'home', foods: [] };
  await saveMealDraft(draft);
  const suggestion = { id: '31', title: 'Try less', description: 'Keep it separate', servingTip: 'No pressure' };
  const harness = await renderHook(t, suggestions => useMealCheckin('1', undefined, false, suggestions, '31'), { props: [suggestion] });
  await waitFor(() => harness.current.draft !== null);
  await act(async () => harness.current.edit());
  const firstId = harness.current.draft.editingFood.id;
  await act(async () => harness.current.changeFood({ name: 'Rice' }));
  await act(async () => harness.current.saveFood());
  await act(async () => harness.current.edit());
  assert.equal(harness.current.draft.suggestionLinks.length, 1);
  assert.equal(harness.current.draft.suggestionLinks[0].foodId, firstId);
});

test('removed food or empty saved list cannot create a stale link', async (t) => {
  const { harness, link } = await linkingHarness(t);
  await link('soup');
  await act(async () => harness.current.saveFood());
  await act(async () => harness.current.removeFood('soup'));
  assert.deepEqual(harness.current.draft.suggestionLinks ?? [], []);
  await harness.rerender([]);
  assert.equal(harness.current.suggestionLinking.canOpenPicker, false);
  await act(async () => harness.current.suggestionLinking.onLink('rice'));
  await act(async () => { await harness.current.flush(); });
  assert.deepEqual((await readMealDraft('1')).suggestionLinks ?? [], []);
});

test('new-food suggestion and later input survive a failed autosave, retry, and remount', async t => {
  const { harness } = await linkingHarness(t);
  await act(async () => harness.current.edit());
  const foodId = harness.current.draft.editingFood.id;
  await act(async () => harness.current.suggestionLinking.onOpenPicker());
  await act(async () => harness.current.suggestionLinking.onSelectSuggestion('31'));
  await act(async () => harness.current.suggestionLinking.onLink(foodId));
  failNextWrite('nurturebites.meal-draft.1.v1');
  await act(async () => harness.current.changeFood({ name: 'Typed after linking' }));
  await waitFor(() => harness.current.saveStatus === 'error');
  assert.equal(harness.current.draft.editingFood.name, 'Typed after linking');
  await act(async () => assert.equal(await harness.current.flush(), true));
  const restored = await renderHook(t, () => useMealCheckin('1'));
  await waitFor(() => restored.current.draft !== null);
  assert.equal(restored.current.draft.editingFood.name, 'Typed after linking');
  assert.equal(restored.current.draft.editingSuggestionLink.foodId, foodId);
  assert.deepEqual(restored.current.draft.suggestionLinks ?? [], []);
  await act(async () => restored.current.saveFood());
  const saved = await readMealDraft('1');
  assert.equal(saved.foods.find(food => food.id === foodId).name, 'Typed after linking');
  assert.equal(saved.suggestionLinks[0].suggestionId, '31');
  assert.equal(saved.suggestionLinks[0].foodId, foodId);
  assert.equal(saved.editingSuggestionLink, null);
});

for (const close of ['cancelEdit', 'back']) {
  test(`${close} discards a newly linked existing-food edit`, async t => {
    const { harness, link } = await linkingHarness(t);
    await link('rice');
    await act(async () => harness.current.changeFood({ name: 'Cancelled name' }));
    await act(async () => harness.current[close]());
    const stored = await readMealDraft('1');
    assert.equal(stored.foods[0].name, 'Rice');
    assert.deepEqual(stored.suggestionLinks ?? [], []);
    assert.equal(stored.editingFood, null);
    assert.equal(stored.editingSuggestionLink, null);
  });

  test(`${close} preserves the original link after unlinking or moving it to a new food`, async t => {
    const { harness, link, firstFood } = await linkingHarness(t);
    await link('rice');
    await act(async () => harness.current.saveFood());
    const original = structuredClone(harness.current.draft.suggestionLinks);
    await act(async () => harness.current.edit(firstFood));
    await act(async () => harness.current.suggestionLinking.onUnlink('31'));
    assert.equal((await readMealDraft('1')).editingSuggestionLink, null);
    await act(async () => harness.current[close]());
    assert.deepEqual((await readMealDraft('1')).suggestionLinks, original);
    await act(async () => harness.current.edit());
    await act(async () => harness.current.suggestionLinking.onOpenPicker());
    await act(async () => harness.current.suggestionLinking.onSelectSuggestion('31'));
    await act(async () => harness.current.suggestionLinking.onLink(harness.current.draft.editingFood.id));
    await act(async () => harness.current[close]());
    assert.deepEqual((await readMealDraft('1')).suggestionLinks, original);
  });
}

test('a manual recommendation choice survives the delayed Record a Try response', async t => {
  const draft = { ...newDraft('1'), step: 'foods', mealType: 'lunch', setting: 'home', foods: [] };
  await saveMealDraft(draft);
  const incoming = { id: '31', title: 'Incoming', description: 'Try less' };
  const manual = { id: '32', title: 'Selected', description: 'Keep it separate' };
  const harness = await renderHook(t, suggestions => useMealCheckin('1', undefined, false, suggestions, '31'),
    { props: [manual] });
  await waitFor(() => harness.current.draft !== null);
  await act(async () => harness.current.edit());
  await act(async () => harness.current.suggestionLinking.onOpenPicker());
  await act(async () => harness.current.suggestionLinking.onSelectSuggestion('32'));
  await act(async () => harness.current.suggestionLinking.onLink(harness.current.draft.editingFood.id));
  await harness.rerender([incoming, manual]);
  assert.equal(harness.current.draft.editingSuggestionLink.suggestionId, '32');
  assert.equal((await readMealDraft('1')).editingSuggestionLink.suggestionId, '32');
});

test('ingredient difficulty edits autosave, survive food editing and failed submission, and restore after save', async t => {
  const response = mealResponse();
  response.foods[0].ingredients = [{ id: '101', name: 'Carrot' }, { id: '102', name: 'Egg' }];
  response.foods.push({ ...response.foods[0], id: '2', name: 'Soup', ingredients: [{ id: '103', name: 'Carrot' }] });
  let serverMeal = response;
  let failSave = true;
  let writes = 0;
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/v1/meals/10' && !init.method) return new Response(JSON.stringify(serverMeal));
    if (path === '/api/v1/meals/10/foods') {
      const foods = JSON.parse(init.body).foods;
      serverMeal = { ...serverMeal, foods: foods.map((food, index) => ({ ...food, id: food.id ?? String(10 + index),
        meal_id: '10', outcome: null, difficulty_reasons: [], recommendation_tries: [],
        ingredients: food.ingredients.map(ingredient => ({ id: ingredient.name === 'Carrot' ? '101' : '102',
          name: ingredient.name, outcome: null, difficulty_reasons: [] })),
      })) };
      return new Response(JSON.stringify(serverMeal));
    }
    assert.equal(path, '/api/v1/meals/10/review');
    writes++;
    const body = JSON.parse(init.body);
    assert.deepEqual(body.food_results[0].difficulty_reasons, []);
    assert.deepEqual(body.food_results[0].ingredient_outcomes, [{ ingredient_id: '101', outcome: 'UNTOUCHED',
      difficulty_reasons: ['SMELL.HERB'] }]);
    if (failSave) return new Response(JSON.stringify({ error_code: 'UNAVAILABLE' }), { status: 503 });
    serverMeal = reviewResponse(serverMeal, body);
    return new Response(JSON.stringify(serverMeal));
  });
  const profile = { id: '1' };
  const h = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => h.current.draft !== null);
  const [carrot, egg] = h.current.draft.outcomes[0].ingredients;
  await act(async () => {
    h.current.manual();
    h.current.chooseOutcome('1', 'tasted');
    h.current.chooseOutcome('2', 'eaten');
    h.current.chooseOutcome('1', 'untouched', carrot.id);
    h.current.setDifficultyInput(carrot.id, { category: 'smell', value: 'fruit', note: '' });
    h.current.addDifficultyTag(carrot.id);
    h.current.setDifficultyInput(carrot.id, { category: 'smell', value: 'herb', note: '' });
    h.current.addDifficultyTag(carrot.id);
    h.current.setDifficultyInput(egg.id, { category: 'texture', subcategory: 'hardness', value: 'firm', note: '' });
    h.current.addDifficultyTag(egg.id);
    h.current.go('difficulties');
  });
  assert.deepEqual(h.current.draft.difficulties[carrot.id].map(tag => tag.value), ['herb']);
  assert.equal(h.current.canContinueOutcomes, true);
  await act(async () => { await h.current.retrySave(); });
  assert.equal((await readAfterMealDraft('1', '10')).difficulties[carrot.id][0].value, 'herb');
  await act(async () => { h.current.toggleIngredient('1', carrot.id); });
  assert.equal(h.current.draft.difficulties[carrot.id][0].value, 'herb');
  await act(async () => { h.current.toggleIngredient('1', carrot.id); });
  await act(async () => { h.current.editFood(h.current.meal.foods[0]); });
  await act(async () => { h.current.changeFood({ ingredients: ['Carrot'] }); });
  await act(async () => { await h.current.saveFood(); });
  assert.equal(h.current.draft.difficulties[carrot.id][0].value, 'herb');
  assert.equal(h.current.draft.difficulties[egg.id], undefined);
  assert.equal(h.current.draft.difficultyInputs[egg.id], undefined);
  await act(async () => { await h.current.removeFood('2'); });
  assert.equal(h.current.draft.difficulties[carrot.id][0].value, 'herb');
  assert.equal(h.current.draft.outcomes.length, 1);
  await act(async () => { assert.equal(await h.current.finish(), false); });
  assert.equal(h.current.draft.step, 'difficulties');
  assert.equal(h.current.draft.difficulties[carrot.id][0].value, 'herb');
  failSave = false;
  await act(async () => { assert.equal(await h.current.finish(), true); });
  assert.equal(writes, 2);
  assert.equal(h.current.draft.step, 'complete');
  const restored = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => restored.current.draft !== null);
  assert.equal(restored.current.draft.difficulties[carrot.id][0].value, 'herb');
  assert.equal(restored.current.draft.outcomes[0].ingredients[0].selected, true);
});
