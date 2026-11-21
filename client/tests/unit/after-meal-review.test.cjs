// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 미추가 어려움 입력의 저장·중복·미완성·대상 제외 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 사진·결과·어려움·완료 검증을 행동별 파일로 분리
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { savedMeal } = require('../fixtures/after-meal-review.cjs');

const { newReviewDraft, reconcileOutcomes, setOutcome } =
  require('../../src/features/after-meal-review/rules.ts');

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
