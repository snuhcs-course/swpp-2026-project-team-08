// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 음식·재료 결과 변경·재선택·기록 해제 후 답변 보존과 진행 조건 검증
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { savedMeal } = require('../../fixtures/after-meal-review.cjs');
const { newReviewDraft, setOutcome, allOutcomesConfirmed, toggleIngredient } =
  require('../../../src/features/after-meal-review/rules.ts');

const choices = ['eaten', 'tasted', 'untouched', 'unclear'];
function unanswered() {
  const meal = savedMeal('outcome-selection');
  meal.foods.push({ ...meal.foods[0], id: 'food-2', name: 'Soup', ingredients: ['Carrot'] });
  return newReviewDraft(meal).outcomes;
}
function answered() {
  const outcomes = unanswered();
  outcomes[0].decision.confirmed = 'tasted';
  outcomes[0].ingredients[0].selected = true;
  outcomes[0].ingredients[0].decision.confirmed = 'untouched';
  outcomes[1].decision.confirmed = 'unclear';
  return outcomes;
}

test('미응답 음식에 Eaten·Tasted·Untouched·Unclear 중 하나를 입력한 결과는 해당 음식만 입력한 값이다', () => {
  for (const choice of choices) {
    const original = unanswered();
    const before = structuredClone(original);
    const expected = structuredClone(original);
    expected[0].decision.confirmed = choice;
    assert.deepEqual(setOutcome(original, 'food-1', choice), expected);
    assert.deepEqual(original, before);
  }
});

test('Tasted인 음식을 Eaten으로 변경하면 해당 음식은 Eaten이고 재료와 다른 음식의 결과는 같다', () => {
  const original = answered();
  const expected = structuredClone(original);
  expected[0].decision.confirmed = 'eaten';
  assert.deepEqual(setOutcome(original, 'food-1', 'eaten'), expected);
});

test('음식이나 재료에 기존 결과와 같은 값을 다시 입력한 결과는 입력 전과 같다', () => {
  for (const choice of choices) {
    const original = answered();
    original[0].decision.confirmed = choice;
    original[0].ingredients[0].decision.confirmed = choice;
    const expected = structuredClone(original);
    assert.deepEqual(setOutcome(original, 'food-1', choice), expected);
    assert.deepEqual(setOutcome(original, 'food-1', choice, original[0].ingredients[0].id), expected);
  }
});

test('서로 다른 음식에 같은 이름의 재료가 있을 때 한 재료의 결과를 변경하면 해당 재료만 변경된다', () => {
  const original = answered();
  original[0].ingredients[1].selected = true;
  original[0].ingredients[1].decision.confirmed = 'unclear';
  original[1].ingredients[0].selected = true;
  original[1].ingredients[0].decision.confirmed = 'eaten';
  const expected = structuredClone(original);
  expected[0].ingredients[0].decision.confirmed = 'tasted';
  assert.deepEqual(setOutcome(original, 'food-1', 'tasted', original[0].ingredients[0].id), expected);
});

test('답변한 재료의 별도 기록을 해제했다가 다시 선택한 결과는 기존 답변과 같다', () => {
  const original = answered();
  const before = structuredClone(original);
  const ingredientId = original[0].ingredients[0].id;
  const withoutTracking = toggleIngredient(original, 'food-1', ingredientId);
  const expected = structuredClone(before);
  expected[0].ingredients[0].selected = false;
  assert.deepEqual(withoutTracking, expected);
  assert.deepEqual(toggleIngredient(withoutTracking, 'food-1', ingredientId), before);
  assert.deepEqual(original, before);
});

test('미응답 음식이 있으면 진행 가능 여부는 false이고 모든 음식이 Unclear이면 true다', () => {
  const outcomes = unanswered();
  assert.equal(allOutcomesConfirmed(outcomes), false);
  outcomes[0].decision.confirmed = 'unclear';
  assert.equal(allOutcomesConfirmed(outcomes), false);
  outcomes[1].decision.confirmed = 'unclear';
  assert.equal(allOutcomesConfirmed(outcomes), true);
});

test('음식 결과가 모두 있고, 별도 기록 재료가 미응답이면 진행 가능 여부는 false이다', () => {
  const outcomes = answered();
  const ingredient = outcomes[0].ingredients[0];
  ingredient.decision.confirmed = null;
  assert.equal(allOutcomesConfirmed(outcomes), false);
});
