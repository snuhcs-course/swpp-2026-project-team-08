// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 기존 식사의 최초 리뷰 상태와 미완료 초안 복원 검증
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name => {
  if (name.endsWith('/mealPhotoPicker')) return {};
});
const { entryMeal, unfinishedReview } = require('../../fixtures/after-meal-entry.cjs');
const { toMealDetail } = require('../../../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../../../src/data/dto/mealLegacyDto.ts');
const { newReviewDraft } = require('../../../src/features/after-meal-review/rules.ts');
const { useAfterMealReview } = require('../../../src/features/after-meal-review/hooks/useAfterMealReview.ts');
const { saveAfterMealDraft, readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');

beforeEach(() => values.clear());

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

test('미완료 After Meal Review에 들어가면 저장된 값과 일치한다', async t => {
  const stored = unfinishedReview();
  await saveAfterMealDraft(stored);
  const response = entryMeal();
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const request = [init.method ?? 'GET', new URL(url).pathname];
    requests.push(request);
    assert.deepEqual(request, ['GET', '/api/v1/meals/10']);
    return Response.json(response);
  });
  const profile = { id: '1' };
  const h = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => h.current.draft !== null);
  assert.deepEqual(h.current.draft, stored);
  assert.equal(h.current.meal.id, '10');
  assert.equal(h.current.canContinueOutcomes, false);
  assert.equal(h.current.finalSaveState, 'idle');
  assert.deepEqual(await readAfterMealDraft('1', '10'), stored);
  assert.deepEqual(requests, [['GET', '/api/v1/meals/10']]);
});
