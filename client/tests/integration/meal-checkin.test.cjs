// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');

const assert = require('node:assert/strict');

require('../helpers/register.cjs');

const { completeDraft } = require('../fixtures/meal-checkin.cjs');

const { createMemoryStorage } = require('../helpers/memory-storage.cjs');

const { values, storage, failNextWrite } = createMemoryStorage();

const { mockModules } = require('../helpers/mock-modules.cjs');

mockModules((name) => { return name === '@react-native-async-storage/async-storage' ? storage : undefined; });

const { newDraft, mealFromDraft } = require('../../src/features/meal-checkin/rules.ts');

const { newFood } = require('../../src/rules/foodDraft.ts');

const { isDraft } = require('../../src/data/storage/mealValidation.ts');

const { readMealDraft, saveMealDraft, readMeals, readMeal, saveMeal } = require('../../src/data/storage/mealStorage.ts');

test('save failure keeps draft, retry is idempotent and home gets exactly one saved meal', async () => {
  const draft = completeDraft('final'); await saveMealDraft(draft);
  const meal = mealFromDraft(draft); failNextWrite('nurturebites.home.final.v1'); await assert.rejects(saveMeal(meal));
  assert.deepEqual((await readMealDraft('final')).foods, draft.foods);
  await saveMeal(meal); await saveMeal(meal);
  assert.equal((await readMeals('final')).length, 1); assert.deepEqual((await readMeal('final', meal.id)).foods, draft.foods);
  assert.equal(JSON.parse(values.get('nurturebites.home.final.v1')).meals.length, 1);
  assert.equal((await readMealDraft('final')).savedMealId, meal.id);
  assert.equal((await readMealDraft('final')).step, 'complete');
});

test('final save is queued after pending drafts, never overwritten by an earlier autosave', async () => {
  const draft = completeDraft('ordering');
  await Promise.all([saveMealDraft({ ...draft, step: 'foods' }), saveMeal(mealFromDraft(draft))]);
  assert.equal((await readMealDraft('ordering')).step, 'complete');
});

test('acceptance and pending suggestion links survive draft/final writes without recording a try', async () => {
  const draft = newDraft('abc-links');
  draft.mealType = 'lunch'; draft.setting = 'home';
  draft.foods = [{ ...newFood(), id: 'served', name: 'Rice', acceptance: 0, confirmed: true, source: 'ai' }];
  draft.suggestionLinks = [{ suggestionId: 'saved-idea', foodId: 'served', title: 'Rice', description: 'Offer a small portion' }];
  assert.equal(isDraft(draft, draft.childId), true);
  assert.equal(isDraft({ ...draft, foods: [{ ...draft.foods[0], acceptance: 4 }] }, draft.childId), false);
  assert.equal(isDraft({ ...draft, suggestionLinks: [{ ...draft.suggestionLinks[0], foodId: 'missing' }] }, draft.childId), false);
  await saveMealDraft(draft);
  assert.deepEqual((await readMealDraft(draft.childId)).suggestionLinks, draft.suggestionLinks);
  const saved = await saveMeal(mealFromDraft(draft));
  assert.equal(saved.foods[0].acceptance, 0);
  assert.equal(saved.foods[0].source, 'ai');
  assert.equal(saved.foods[0].confirmed, true);
  assert.deepEqual(saved.suggestionLinks, draft.suggestionLinks);
  assert.equal(saved.suggestionFeedback, undefined);
});
