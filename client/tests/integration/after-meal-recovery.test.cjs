// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { act, renderHook, waitFor, deferred } = require('../helpers/react-harness.cjs');
let pickPhoto;
const { values } = require('../helpers/native-boundaries.cjs').nativeBoundaries(name => {
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
    assert.equal(body.food_results[0].outcome, 'tasted');
    requests++;
    if (!fails) serverMeal = { ...response, review: reviewResponse(response, body) };
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
  const open = async () => {
    await act(async () => harness.current.suggestionLinking.onOpen());
    await act(async () => harness.current.suggestionLinking.onSelectSuggestion('31'));
    await act(async () => harness.current.suggestionLinking.onContinue());
  };
  return { harness, open, firstFood };
}

test('cancelling suggestion linking leaves the saved draft unchanged', async (t) => {
  const { harness, open } = await linkingHarness(t);
  await open();
  assert.equal(harness.current.suggestionLinking.canContinue, false);
  await act(async () => harness.current.suggestionLinking.onBack());
  await act(async () => harness.current.suggestionLinking.onBack());
  assert.equal(harness.current.suggestionLinking.step, 0);
  assert.deepEqual((await readMealDraft('1')).suggestionLinks ?? [], []);
});

test('editing while linking returns to selection and persists the edited food and link', async (t) => {
  const { harness, open, firstFood } = await linkingHarness(t);
  await open();
  await act(async () => harness.current.suggestionLinking.onSelectFood('rice'));
  await act(async () => harness.current.edit(firstFood));
  assert.equal(harness.current.suggestionLinking.step, 0);
  await act(async () => harness.current.changeFood({ name: 'Edited rice' }));
  await act(async () => harness.current.saveFood());
  assert.equal(harness.current.suggestionLinking.step, 2);
  assert.equal(harness.current.suggestionLinking.selectedFoodId, 'rice');
  assert.equal(harness.current.draft.foods[0].name, 'Edited rice');
  await act(async () => harness.current.edit(harness.current.draft.foods[0]));
  await act(async () => harness.current.update({ editingFood: null }));
  assert.equal(harness.current.suggestionLinking.step, 2);
  await act(async () => harness.current.suggestionLinking.onContinue());
  await act(async () => { await harness.current.flush(); });
  const restored = await readMealDraft('1');
  assert.equal(restored.foods[0].name, 'Edited rice');
  assert.deepEqual(restored.suggestionLinks, [{ suggestionId: '31', foodId: 'rice',
    title: 'Try less', description: 'Keep it separate', servingTip: 'No pressure' }]);
  assert.deepEqual(harness.client.getQueryData(mealKeys.draft('1')).suggestionLinks,
    restored.suggestionLinks.map(link => ({ ...link, ingredientId: undefined })));
});

test('relinking replaces the previous target and unlinking persists removal', async (t) => {
  const { harness, open } = await linkingHarness(t);
  for (const target of ['rice', 'soup']) {
    await open();
    await act(async () => harness.current.suggestionLinking.onSelectFood(target));
    await act(async () => harness.current.suggestionLinking.onContinue());
  }
  assert.equal(harness.current.draft.suggestionLinks.length, 1);
  assert.equal(harness.current.draft.suggestionLinks[0].foodId, 'soup');
  await act(async () => harness.current.suggestionLinking.onUnlink('31'));
  await act(async () => { await harness.current.flush(); });
  assert.deepEqual((await readMealDraft('1')).suggestionLinks, []);
});

test('removed food or suggestion cannot create a stale link', async (t) => {
  const { harness, open } = await linkingHarness(t);
  await open();
  await act(async () => harness.current.suggestionLinking.onSelectFood('soup'));
  await act(async () => harness.current.removeFood('soup'));
  assert.equal(harness.current.suggestionLinking.canContinue, false);
  await act(async () => harness.current.suggestionLinking.onContinue());
  assert.deepEqual(harness.current.draft.suggestionLinks ?? [], []);
  await harness.rerender([]);
  assert.equal(harness.current.suggestionLinking.selectedSuggestion, undefined);
  assert.equal(harness.current.suggestionLinking.canContinue, false);
  await act(async () => harness.current.suggestionLinking.onContinue());
  await act(async () => { await harness.current.flush(); });
  assert.deepEqual((await readMealDraft('1')).suggestionLinks ?? [], []);
});
