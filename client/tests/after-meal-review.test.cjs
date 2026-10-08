const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText,
  filename,
);
const values = new Map();
let failedKey = null;
const storage = {
  async getItem(key) { return values.get(key) ?? null; },
  async setItem(key, value) {
    if (key === failedKey) { failedKey = null; throw new Error('Disk full'); }
    values.set(key, value);
  },
  async removeItem(key) { values.delete(key); },
};
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  return name === '@react-native-async-storage/async-storage' ? storage : originalLoad.call(this, name, ...args);
};

const { newDraft, mealFromDraft } = require('../src/features/meal-checkin/rules.ts');
const { newFood } = require('../src/rules/foodDraft.ts');
const { saveMeal, readMeal, updateMealFoods } = require('../src/data/storage/mealStorage.ts');
const { readAfterMealDraft, readAfterMealReview, saveAfterMealDraft, saveAfterMealReview } =
  require('../src/data/storage/afterMealReviewStorage.ts');
const { newReviewDraft, reconcileOutcomes, setOutcome, applySuggestions, allOutcomesConfirmed, addDifficulty, reviewFromDraft } =
  require('../src/features/after-meal-review/rules.ts');
const { compareMealPhotos } = require('../src/data/api/afterMealComparisonApi.ts');

function savedMeal(childId) {
  const draft = newDraft(childId);
  draft.mealType = 'lunch'; draft.setting = 'home';
  draft.photo = { id: 'before', uri: 'file:///before.png', mimeType: 'image/png' };
  draft.foods = [{ ...newFood(), id: 'food-1', name: 'Rice', ingredients: ['Carrot', 'Egg'] }];
  draft.step = 'goal';
  return mealFromDraft(draft);
}

test('AI suggestions remain separate from independently confirmed food and ingredient outcomes', () => {
  const meal = savedMeal('outcomes');
  let draft = newReviewDraft(meal);
  const ingredient = draft.outcomes[0].ingredients[0].id;
  draft.outcomes = applySuggestions(draft.outcomes, [{ foodId: 'food-1', outcome: 'eaten' }, { foodId: 'food-1', ingredientId: ingredient, outcome: 'eaten' }]);
  assert.equal(allOutcomesConfirmed(draft.outcomes), false);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'tasted');
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'untouched', ingredient);
  assert.equal(draft.outcomes[0].decision.confirmed, 'tasted');
  assert.equal(draft.outcomes[0].ingredients[0].decision.confirmed, 'untouched');
  assert.equal(draft.outcomes[0].ingredients[1].decision.confirmed, null);
  assert.equal(allOutcomesConfirmed(draft.outcomes), false);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'unclear', draft.outcomes[0].ingredients[1].id);
  assert.equal(allOutcomesConfirmed(draft.outcomes), true);
  assert.throws(() => reviewFromDraft(draft, meal), /photo/);
  draft.afterPhoto = { id: 'after', uri: 'file:///after.png', mimeType: 'image/png' };
  assert.equal(reviewFromDraft(draft, meal).outcomes[0].ingredients[1].decision.confirmed, 'unclear');
});

test('food edits retain matching ingredient IDs and drop removed ingredient outcomes', () => {
  const meal = savedMeal('editing');
  const original = newReviewDraft(meal).outcomes;
  const carrotId = original[0].ingredients[0].id;
  const answered = setOutcome(original, 'food-1', 'eaten', carrotId);
  const edited = reconcileOutcomes(answered, [{ ...meal.foods[0], ingredients: ['Carrot', 'Potato'] }]);
  assert.equal(edited[0].ingredients[0].id, carrotId);
  assert.equal(edited[0].ingredients[0].decision.confirmed, 'eaten');
  assert.equal(edited[0].ingredients[1].decision.confirmed, null);
  assert.equal(edited[0].ingredients.some((item) => item.name === 'Egg'), false);
  const repeated = reconcileOutcomes([], [{ ...meal.foods[0], ingredients: ['Egg', 'egg'] }]);
  assert.notEqual(repeated[0].ingredients[0].id, repeated[0].ingredients[1].id);
});

test('difficulty tags keep multiple values but replace single-choice categories', () => {
  let tags = addDifficulty([], 'texture', 'soft');
  tags = addDifficulty(tags, 'texture', 'crunchy');
  tags = addDifficulty(tags, 'smell', 'strong');
  tags = addDifficulty(tags, 'smell', 'mild');
  assert.deepEqual(tags.filter((tag) => tag.category === 'texture').map((tag) => tag.value), ['soft', 'crunchy']);
  assert.deepEqual(tags.filter((tag) => tag.category === 'smell').map((tag) => tag.value), ['mild']);
  assert.equal(addDifficulty(tags, 'texture', '  ').length, tags.length);
});

test('stored after-meal draft and result are tied to one meal and preserve the before photo', async () => {
  values.clear();
  const meal = savedMeal('storage');
  await saveMeal(meal);
  let draft = newReviewDraft(meal);
  draft.afterPhoto = { id: 'after', uri: 'file:///after.png', mimeType: 'image/png' };
  await saveAfterMealDraft({ ...draft, step: 'preview' });
  const loaded = await readAfterMealDraft(meal.childId, meal.id);
  assert.equal(loaded.afterPhoto.id, 'after');
  assert.equal((await readMeal(meal.childId, meal.id)).photo.id, 'before');
  const oldIngredient = loaded.outcomes[0].ingredients[0].id;
  await updateMealFoods(meal.childId, meal.id, [{ ...meal.foods[0], ingredients: ['Carrot', 'Potato'] }]);
  const updated = await readMeal(meal.childId, meal.id);
  assert.equal(updated.photo.id, 'before');
  draft.outcomes = reconcileOutcomes(loaded.outcomes, updated.foods);
  assert.equal(draft.outcomes[0].ingredients[0].id, oldIngredient);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'eaten');
  for (const ingredient of draft.outcomes[0].ingredients) draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'tasted', ingredient.id);
  const result = reviewFromDraft(draft, updated);
  failedKey = `nurturebites.after-meal.${meal.childId}.${meal.id}.result.v1`;
  await assert.rejects(saveAfterMealReview(result));
  assert.equal((await readAfterMealDraft(meal.childId, meal.id)).step, 'preview');
  await saveAfterMealReview(result);
  await saveAfterMealReview(result);
  assert.equal((await readAfterMealReview(meal.childId, meal.id)).afterPhoto.id, 'after');
  assert.equal((await readAfterMealDraft(meal.childId, meal.id)).step, 'complete');
});

test('comparison mock is cancellable and never asserts consumption from image pixels', async () => {
  const meal = savedMeal('compare');
  const after = { id: 'after', uri: 'file:///after.png', mimeType: 'image/png' };
  const controller = new AbortController();
  const cancelled = compareMealPhotos({ mealId: meal.id, before: meal.photo, after, foods: meal.foods, signal: controller.signal });
  controller.abort();
  await assert.rejects(cancelled);
  const result = await compareMealPhotos({ mealId: meal.id, before: meal.photo, after, foods: meal.foods, signal: new AbortController().signal });
  assert.equal(result.mealId, meal.id);
  assert.equal(result.afterPhotoId, 'after');
  assert.equal(result.suggestions.every((item) => item.outcome === 'unclear'), true);
  await assert.rejects(compareMealPhotos({ mealId: '', before: meal.photo, after, foods: meal.foods, signal: new AbortController().signal }));
});

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
