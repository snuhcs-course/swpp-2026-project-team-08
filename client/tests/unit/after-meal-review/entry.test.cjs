// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 최초 리뷰 상태 검증 및 미완료 복원 검증을 초안 행동으로 이동
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { entryMeal } = require('../../fixtures/after-meal-entry.cjs');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../../src/data/dto/mealLegacyDto.ts');
const { newReviewDraft } = require('../../../src/features/after-meal-review/rules.ts');

test('식후 검토를 처음 시작하는 식사의 음식·재료 결과는 미응답이고 식후 사진은 없다', () => {
  const meal = toLegacyMeal(toMealDetail(entryMeal()));
  const before = structuredClone(meal);
  const draft = newReviewDraft(meal);
  assert.equal(draft.mealId, '10');
  assert.equal(draft.childId, '1');
  assert.equal(draft.step, 'photo');
  assert.equal(draft.afterPhoto, null);
  assert.deepEqual(draft.outcomes.map(food => [food.foodId, food.decision]), [
    ['1', { confirmed: null, suggested: null }], ['2', { confirmed: null, suggested: null }],
  ]);
  assert.deepEqual(draft.outcomes[0].ingredients.map(item => [item.name, item.selected, item.decision]), [
    ['Carrot', false, { confirmed: null, suggested: null }],
    ['Egg', false, { confirmed: null, suggested: null }],
  ]);
  assert.deepEqual(draft.difficulties, {});
  assert.deepEqual(draft.difficultyInputs, {});
  assert.deepEqual(meal, before);
});
