// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 미추가 어려움 입력의 저장·중복·미완성·대상 제외 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { savedMeal } = require('../fixtures/after-meal-review.cjs');

const { newReviewDraft, reconcileOutcomes, setOutcome, applySuggestions, allOutcomesConfirmed, addDifficulty, reviewFromDraft, toggleIngredient } =
  require('../../src/features/after-meal-review/rules.ts');

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
  assert.equal(allOutcomesConfirmed(draft.outcomes), true);
  draft.outcomes = toggleIngredient(draft.outcomes, 'food-1', draft.outcomes[0].ingredients[1].id);
  assert.equal(allOutcomesConfirmed(draft.outcomes), false);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'unclear', draft.outcomes[0].ingredients[1].id);
  assert.equal(allOutcomesConfirmed(draft.outcomes), true);
  assert.equal(reviewFromDraft(draft, meal).afterPhoto, null);
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

test('legacy follow-up drafts resume at difficulties without changing current steps', () => {
  const { normalizeReviewStep } = require('../../src/features/after-meal-review/rules.ts');
  assert.equal(normalizeReviewStep('suggestions'), 'difficulties');
  for (const step of ['photo', 'preview', 'compare', 'outcomes', 'difficulties', 'complete']) assert.equal(normalizeReviewStep(step), step);
});

test('final review includes complete inputs using the existing duplicate and single-choice rules', () => {
  const meal = savedMeal('pending-difficulties');
  const draft = newReviewDraft(meal);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'tasted');
  draft.difficulties['food-1'] = addDifficulty([], 'smell', 'fruit');
  draft.difficultyInputs['food-1'] = { category: 'smell', value: 'mint', note: '' };
  const review = reviewFromDraft(draft, meal);
  assert.deepEqual(review.difficulties['food-1'].map(tag => tag.value), ['mint']);
  assert.equal(draft.difficulties['food-1'][0].value, 'fruit');
  assert.equal(draft.difficultyInputs['food-1'].value, 'mint');
  draft.difficulties = review.difficulties;
  assert.equal(reviewFromDraft(draft, meal).difficulties['food-1'].length, 1);
  draft.difficultyInputs['food-1'] = { category: 'texture', subcategory: 'hardness', value: 'firm', note: '' };
  assert.deepEqual(reviewFromDraft(draft, meal).difficulties['food-1'].map(tag => tag.value), ['mint', 'firm']);
  for (const input of [
    { category: null, value: '', note: '' },
    { category: 'texture', value: 'firm', note: '' },
    { category: 'texture', subcategory: 'moisture', value: 'firm', note: '' },
    { category: 'color', value: 'other', note: ' ' },
  ]) {
    draft.difficultyInputs['food-1'] = input;
    assert.deepEqual(reviewFromDraft(draft, meal).difficulties['food-1'].map(tag => tag.value), ['mint']);
  }
});

test('pending reasons for eaten foods and deselected ingredients are excluded', () => {
  const meal = savedMeal('excluded-inputs');
  const draft = newReviewDraft(meal);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'eaten');
  const ingredient = draft.outcomes[0].ingredients[0].id;
  draft.difficultyInputs['food-1'] = { category: 'smell', value: 'mint', note: '' };
  draft.difficultyInputs[ingredient] = { category: 'color', value: 'red', note: '' };
  assert.deepEqual(reviewFromDraft(draft, meal).difficulties, {});
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'untouched', ingredient);
  assert.deepEqual(Object.keys(reviewFromDraft(draft, meal).difficulties), [ingredient]);
  assert.equal(reviewFromDraft(draft, meal).difficulties[ingredient][0].value, 'red');
});
