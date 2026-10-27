// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../helpers/register.cjs');

const { savedMeal } = require('../fixtures/after-meal-review.cjs');

const { createMemoryStorage } = require('../helpers/memory-storage.cjs');

const { values, storage } = createMemoryStorage();

const { mockModules } = require('../helpers/mock-modules.cjs');

mockModules((name) => {
  return name === '@react-native-async-storage/async-storage' ? storage : undefined;
});

const { readAfterMealDraft, readAfterMealReview, saveAfterMealDraft, saveAfterMealReview } =
  require('../../src/data/storage/afterMealReviewStorage.ts');

const { newReviewDraft, setOutcome, reviewFromDraft } =
  require('../../src/features/after-meal-review/rules.ts');

test('final review follows pending autosaves and rejects unanswered results', async () => {
  values.clear();
  const meal = savedMeal('ordering');
  const draft = newReviewDraft(meal);
  draft.afterPhoto = { id: 'after', uri: 'file:///after.png', mimeType: 'image/png' };
  await assert.rejects(saveAfterMealReview({ ...draft, savedAt: new Date().toISOString() }));
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'eaten');
  for (const item of draft.outcomes[0].ingredients) draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'tasted', item.id);
  const result = reviewFromDraft(draft, meal);
  await Promise.all([saveAfterMealDraft({ ...draft, step: 'outcomes' }), saveAfterMealReview(result)]);
  assert.equal((await readAfterMealDraft(meal.childId, meal.id)).step, 'complete');
  assert.equal((await readAfterMealReview(meal.childId, meal.id)).outcomes[0].decision.confirmed, 'eaten');
});

test('legacy reviews resume safely and omit retired feedback from saved results', async () => {
  const meal = savedMeal('retired-feedback');
  const draft = newReviewDraft(meal);
  draft.outcomes = setOutcome(draft.outcomes, meal.foods[0].id, 'eaten');
  values.set(`nurturebites.after-meal.${meal.childId}.${meal.id}.draft.v1`, JSON.stringify({
    ...draft, step: 'goal', goalFeedback: 'achieved',
  }));
  const restored = await readAfterMealDraft(meal.childId, meal.id);
  assert.equal(restored.step, 'difficulties');
  assert.deepEqual(restored.outcomes, draft.outcomes);
  assert.equal(Object.hasOwn(restored, 'goalFeedback'), false);
  const review = reviewFromDraft(restored, meal);
  values.set(`nurturebites.after-meal.${meal.childId}.${meal.id}.result.v1`, JSON.stringify({ ...review, goalFeedback: 'tried' }));
  assert.deepEqual(await readAfterMealReview(meal.childId, meal.id), review);
});

test('feedback uses a strict boolean property and migrates both legacy answers', async () => {
  const meal = savedMeal('boolean-feedback');
  const draft = newReviewDraft(meal);
  draft.suggestionFeedback = { yes: { tried: true }, no: { tried: false } };
  await saveAfterMealDraft(draft);
  assert.deepEqual((await readAfterMealDraft(meal.childId, meal.id)).suggestionFeedback, draft.suggestionFeedback);
  for (const invalid of ['tried', 'notTried', true, {}, { tried: 'false' }, { tried: 0 }, { tried: null }]) {
    await assert.rejects(saveAfterMealDraft({ ...draft, suggestionFeedback: { invalid } }));
  }
  values.set(`nurturebites.after-meal.${meal.childId}.${meal.id}.draft.v1`, JSON.stringify({
    ...draft, suggestionFeedback: { yes: 'tried', no: 'notTried' },
  }));
  const restored = await readAfterMealDraft(meal.childId, meal.id);
  assert.deepEqual(restored.suggestionFeedback, draft.suggestionFeedback);
  const complete = { ...restored, outcomes: setOutcome(restored.outcomes, meal.foods[0].id, 'eaten') };
  const review = reviewFromDraft(complete, meal);
  values.set(`nurturebites.after-meal.${meal.childId}.${meal.id}.result.v1`, JSON.stringify({
    ...review, suggestionFeedback: { yes: 'tried', no: 'notTried' },
  }));
  assert.deepEqual((await readAfterMealReview(meal.childId, meal.id)).suggestionFeedback, draft.suggestionFeedback);
});
