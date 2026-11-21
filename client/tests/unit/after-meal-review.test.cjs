// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 미추가 어려움 입력의 저장·중복·미완성·대상 제외 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 사진·결과·어려움 중복 검증 분리 및 Eaten 어려움 저장 기대값 수정
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { savedMeal } = require('../fixtures/after-meal-review.cjs');

const { newReviewDraft, reconcileOutcomes, setOutcome, addDifficulty, reviewFromDraft } =
  require('../../src/features/after-meal-review/rules.ts');

test('식후 사진이 없으면 최종 리뷰의 사진은 null이고 사진이 있으면 같은 사진을 포함한다', () => {
  const meal = savedMeal('review-photo');
  const draft = newReviewDraft(meal);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'tasted');
  assert.equal(reviewFromDraft(draft, meal).afterPhoto, null);
  draft.afterPhoto = { id: 'after', uri: 'file:///after.png', mimeType: 'image/png' };
  assert.deepEqual(reviewFromDraft(draft, meal).afterPhoto, draft.afterPhoto);
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

test('Eaten 음식의 사유는 저장하며 선택하지 않은 재료의 사유는 제외한다', () => {
  const meal = savedMeal('excluded-inputs');
  const draft = newReviewDraft(meal);
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'eaten');
  const ingredient = draft.outcomes[0].ingredients[0].id;
  draft.difficultyInputs['food-1'] = { category: 'smell', value: 'mint', note: '' };
  draft.difficultyInputs[ingredient] = { category: 'color', value: 'red', note: '' };
  assert.deepEqual(Object.keys(reviewFromDraft(draft, meal).difficulties), ['food-1']);
  assert.equal(reviewFromDraft(draft, meal).difficulties['food-1'][0].value, 'mint');
  draft.outcomes = setOutcome(draft.outcomes, 'food-1', 'untouched', ingredient);
  assert.deepEqual(Object.keys(reviewFromDraft(draft, meal).difficulties), ['food-1', ingredient]);
  assert.equal(reviewFromDraft(draft, meal).difficulties[ingredient][0].value, 'red');
});
