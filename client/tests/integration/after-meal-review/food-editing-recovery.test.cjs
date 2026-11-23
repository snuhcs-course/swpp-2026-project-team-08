// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Ingredient difficulty autosave, food editing, failure and server restoration
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 리뷰 요청의 대문자 outcome 과 식사 상세 응답 기준으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 재료 난이도 테스트를 서버 난이도 값과 식사 상세 응답 기준으로 수정
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: Add 없이 입력한 음식·재료 사유의 저장 실패·재시도·복원 검증
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 음식 편집에서 저장 추천 연결 및 Record a Try 미리 채움 검증
// AI-generated with GPT-6, 2026-11-13, reviewed by Haechan Jung
// Changed: 편집 추천의 저장·취소·복원과 자동 연결 검증
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 일반 추천 연결·취소·저장 검증을 행동별 테스트로 이동
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 재료 사유의 편집·저장 실패·복원 흐름 분리
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { act, renderHook, waitFor } = require('../../helpers/react-harness.cjs');
const { values } = require('../../helpers/native-boundaries.cjs').nativeBoundaries(name => {
  if (name.endsWith('/mealPhotoPicker')) return {};
});
const { mealResponse, reviewResponse } = require('../../fixtures/server-meal.cjs');
const { readAfterMealDraft } = require('../../../src/data/storage/afterMealReviewStorage.ts');
const { useAfterMealReview } = require('../../../src/features/after-meal-review/hooks/useAfterMealReview.ts');
beforeEach(t => {
  values.clear();
  t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected HTTP request'); });
});

test('음식을 수정하면 남은 재료의 사유만 유지되며, 리뷰 저장 실패 후 재시도하고 다시 열어도 같은 사유가 복원된다', async t => {
  const response = mealResponse();
  response.foods[0].ingredients = [{ id: '101', name: 'Carrot' }, { id: '102', name: 'Egg' }];
  response.foods.push({ ...response.foods[0], id: '2', name: 'Soup', ingredients: [{ id: '103', name: 'Carrot' }] });
  let serverMeal = response;
  let failSave = true;
  let writes = 0;
  t.mock.method(global, 'fetch', async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/v1/meals/10' && !init.method) return new Response(JSON.stringify(serverMeal));
    if (path === '/api/v1/meals/10/foods') {
      const foods = JSON.parse(init.body).foods;
      serverMeal = { ...serverMeal, foods: foods.map((food, index) => ({ ...food, id: food.id ?? String(10 + index),
        meal_id: '10', outcome: null, difficulty_reasons: [], recommendation_tries: [],
        ingredients: food.ingredients.map(ingredient => ({ id: ingredient.name === 'Carrot' ? '101' : '102',
          name: ingredient.name, outcome: null, difficulty_reasons: [] })),
      })) };
      return new Response(JSON.stringify(serverMeal));
    }
    assert.equal(path, '/api/v1/meals/10/review');
    writes++;
    const body = JSON.parse(init.body);
    assert.deepEqual(body.food_results[0].difficulty_reasons, []);
    assert.deepEqual(body.food_results[0].ingredient_outcomes, [{ ingredient_id: '101', outcome: 'UNTOUCHED',
      difficulty_reasons: ['SMELL.HERB'] }]);
    if (failSave) return new Response(JSON.stringify({ error_code: 'UNAVAILABLE' }), { status: 503 });
    serverMeal = reviewResponse(serverMeal, body);
    return new Response(JSON.stringify(serverMeal));
  });
  const profile = { id: '1' };
  const h = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => h.current.draft !== null);
  const [carrot, egg] = h.current.draft.outcomes[0].ingredients;
  await act(async () => {
    h.current.manual();
    h.current.chooseOutcome('1', 'tasted');
    h.current.chooseOutcome('2', 'eaten');
    h.current.chooseOutcome('1', 'untouched', carrot.id);
    h.current.setDifficultyInput(carrot.id, { category: 'smell', value: 'fruit', note: '' });
    h.current.addDifficultyTag(carrot.id);
    h.current.setDifficultyInput(carrot.id, { category: 'smell', value: 'herb', note: '' });
    h.current.addDifficultyTag(carrot.id);
    h.current.setDifficultyInput(egg.id, { category: 'texture', subcategory: 'hardness', value: 'firm', note: '' });
    h.current.addDifficultyTag(egg.id);
    h.current.go('difficulties');
  });
  assert.deepEqual(h.current.draft.difficulties[carrot.id].map(tag => tag.value), ['herb']);
  assert.equal(h.current.canContinueOutcomes, true);
  await act(async () => { await h.current.retrySave(); });
  assert.equal((await readAfterMealDraft('1', '10')).difficulties[carrot.id][0].value, 'herb');
  await act(async () => { h.current.toggleIngredient('1', carrot.id); });
  assert.equal(h.current.draft.difficulties[carrot.id][0].value, 'herb');
  await act(async () => { h.current.toggleIngredient('1', carrot.id); });
  await act(async () => { h.current.editFood(h.current.meal.foods[0]); });
  await act(async () => { h.current.changeFood({ ingredients: ['Carrot'] }); });
  await act(async () => { await h.current.saveFood(); });
  assert.equal(h.current.draft.difficulties[carrot.id][0].value, 'herb');
  assert.equal(h.current.draft.difficulties[egg.id], undefined);
  assert.equal(h.current.draft.difficultyInputs[egg.id], undefined);
  await act(async () => { await h.current.removeFood('2'); });
  assert.equal(h.current.draft.difficulties[carrot.id][0].value, 'herb');
  assert.equal(h.current.draft.outcomes.length, 1);
  await act(async () => { assert.equal(await h.current.finish(), false); });
  assert.equal(h.current.draft.step, 'difficulties');
  assert.equal(h.current.draft.difficulties[carrot.id][0].value, 'herb');
  failSave = false;
  await act(async () => { assert.equal(await h.current.finish(), true); });
  assert.equal(writes, 2);
  assert.equal(h.current.draft.step, 'complete');
  const restored = await renderHook(t, () => useAfterMealReview(profile, '10'));
  await waitFor(() => restored.current.draft !== null);
  assert.equal(restored.current.draft.difficulties[carrot.id][0].value, 'herb');
  assert.equal(restored.current.draft.outcomes[0].ingredients[0].selected, true);
});
