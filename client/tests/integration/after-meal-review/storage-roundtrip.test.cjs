// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 초안·완료 저장 연계 검증 이동 및 결과 규칙 중복 제거
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { savedMeal } = require('../../fixtures/after-meal-review.cjs');
const { createMemoryStorage } = require('../../helpers/memory-storage.cjs');
const { values, storage, failNextWrite } = createMemoryStorage();
const { mockModules } = require('../../helpers/mock-modules.cjs');
mockModules((name) => {
  return name === '@react-native-async-storage/async-storage' ? storage : undefined;
});
const { saveMeal, readMeal, updateMealFoods } = require('../../../src/data/storage/mealStorage.ts');
const { readAfterMealDraft, readAfterMealReview, saveAfterMealDraft, saveAfterMealReview } =
  require('../../../src/data/storage/afterMealReviewStorage.ts');
const { newReviewDraft, reconcileOutcomes, setOutcome, addDifficulty, reviewFromDraft, toggleIngredient } =
  require('../../../src/features/after-meal-review/rules.ts');

test('식후 리뷰 저장에 실패하면 초안과 식전 사진을 유지하고 재시도 성공 후 같은 식사의 완료 결과를 조회할 수 있다', async () => {
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
  failNextWrite(`nurturebites.after-meal.${meal.childId}.${meal.id}.result.v1`);
  await assert.rejects(saveAfterMealReview(result));
  assert.equal((await readAfterMealDraft(meal.childId, meal.id)).step, 'preview');
  await saveAfterMealReview(result);
  await saveAfterMealReview(result);
  assert.equal((await readAfterMealReview(meal.childId, meal.id)).afterPhoto.id, 'after');
  assert.equal((await readAfterMealDraft(meal.childId, meal.id)).step, 'complete');
});

test('사진 없는 리뷰를 저장하고 조회하면 별도 기록한 재료의 답변만 포함되고 식후 사진은 없다', async () => {
  const meal = savedMeal('photo-free');
  const draft = newReviewDraft(meal);
  draft.comparisonMethod = 'manual';
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'unclear');
  const id = draft.outcomes[0].ingredients[0].id;
  draft.outcomes = toggleIngredient(draft.outcomes, 'food-1', id);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'tasted', id);
  draft.outcomes = toggleIngredient(draft.outcomes, 'food-1', id);
  assert.equal(reviewFromDraft(draft, meal).outcomes[0].ingredients.length, 0);
  draft.outcomes = toggleIngredient(draft.outcomes, 'food-1', id);
  const result = reviewFromDraft(draft, meal);
  await saveAfterMealReview(result);
  const loaded = await readAfterMealReview(meal.childId, meal.id);
  assert.equal(loaded.afterPhoto, null);
  assert.equal(loaded.outcomes[0].ingredients.length, 1);
  assert.equal(loaded.outcomes[0].ingredients[0].decision.confirmed, 'tasted');
});

test('Texture 세부 항목이 있는 초안을 저장하고 조회한 결과는 저장 전 태그와 같다', async () => {
  let tags = addDifficulty([], 'texture', 'firm', '', 'hardness');
  tags = addDifficulty(tags, 'texture', 'dry', '', 'moisture');
  tags = addDifficulty(tags, 'smell', 'mint');
  tags = addDifficulty(tags, 'arrangement', 'clustered');
  const meal = savedMeal('texture');
  const draft = newReviewDraft(meal);
  draft.difficulties['food-1'] = tags;
  await saveAfterMealDraft(draft);
  const loaded = await readAfterMealDraft(meal.childId, meal.id);
  assert.deepEqual(loaded.difficulties['food-1'], tags);
});
