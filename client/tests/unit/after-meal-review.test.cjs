// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
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
