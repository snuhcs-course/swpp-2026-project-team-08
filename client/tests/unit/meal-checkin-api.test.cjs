// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 삭제된 재료 카탈로그 API 검증 제거, 서버 발급 id·대문자 enum 저장 계약으로 수정
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

let request;

const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules((name) => {
  if (name.endsWith('/network/apiClient')) return { apiRequest: (...params) => request(...params) };
  return undefined;
});

const { prepareMealWrite, writeMeal } = require('../../src/data/api/mealWriteApi.ts');

const { listSavedSuggestions } = require('../../src/data/api/savedSuggestionListApi.ts');

const { listMealDetails } = require('../../src/data/api/mealReadApi.ts');

const { suggestionResponse } = require('../fixtures/server-suggestion.cjs');

const meal = {
  id: 'local-draft', childId: '1', mealDate: '2026-10-21', mealType: 'lunch',
  setting: 'home', photo: null, savedAt: '2026-10-21T00:00:00Z',
  foods: [
    { id: 'local-food-a', name: 'Potato', ingredients: ['Potato'], preparation: '삶기', servingNote: '', source: 'parent', confirmed: true, acceptance: 1 },
    { id: 'local-food-b', name: 'Carrot', ingredients: ['Carrot'], preparation: '', servingNote: '', source: 'parent', confirmed: true, acceptance: null },
  ],
  suggestionLinks: [{ suggestionId: '301', foodId: 'local-food-b', title: 'Try carrot', description: 'Small serving' }],
};

function savedResponse() {
  return {
    id: '502', user_id: '1', meal_date: '2026-10-21', meal_type: 'LUNCH', setting: 'HOME',
    before_photo_uri: null, after_photo_uri: null, saved_at: '2026-10-21T08:00:00Z',
    foods: [
      { id: '71', meal_id: '502', name: 'Potato', cooking_method: 'BOILED', serving_note: null, acceptance: 1,
        outcome: null, difficulty_reasons: [], recommendation_tries: [],
        ingredients: [{ id: '81', name: 'Potato', outcome: null, difficulty_reasons: [] }] },
      { id: '72', meal_id: '502', name: 'Carrot', cooking_method: null, serving_note: null, acceptance: null,
        outcome: null, difficulty_reasons: [],
        recommendation_tries: [{
          id: '91', food_recommendation_id: '301', feedback: null,
          created_at: '2026-10-21T08:00:00Z', updated_at: '2026-10-21T08:00:00Z',
          recommendation: { what_to_try: 'Try carrot', why_this_may_help: 'Small serving', serving_tip: null },
        }],
        ingredients: [{ id: '82', name: 'Carrot', outcome: null, difficulty_reasons: [] }] },
    ],
  };
}

test('meal write sends uppercase values and no IDs, grouping suggestion links per food', async () => {
  const { body } = prepareMealWrite(meal);
  assert.equal(body.meal_type, 'LUNCH');
  assert.equal(body.setting, 'HOME');
  assert.deepEqual(body.foods.map((food) => 'id' in food), [false, false]);
  assert.equal(body.foods[0].cooking_method, 'BOILED');
  assert.deepEqual(body.foods[0].ingredients, [{ name: 'Potato' }]);
  assert.deepEqual(body.foods.map((food) => food.food_recommendation_ids), [[], ['301']]);
  assert.equal('suggestion_links' in body, false);
  request = async (path, init) => {
    assert.equal(path, '/api/v1/meals');
    assert.equal(init.method, 'PUT');
    assert.deepEqual(JSON.parse(init.body), body);
    return savedResponse();
  };
  const saved = await writeMeal(meal);
  assert.equal(saved.id, '502');
  // 서버가 발급한 음식 id 를 요청 순서대로 받고 추천 연결도 새 id 로 옮긴다.
  assert.deepEqual(saved.foods.map((food) => food.id), ['71', '72']);
  assert.equal(saved.suggestionLinks[0].foodId, '72');
});

test('meal write rejects a response whose foods do not match the request', async () => {
  request = async () => ({ ...savedResponse(), foods: savedResponse().foods.slice(0, 1) });
  await assert.rejects(writeMeal(meal));
  request = async () => ({ ...savedResponse(), meal_type: 'DINNER' });
  await assert.rejects(writeMeal(meal));
  request = async () => ({ ...savedResponse(), meal_type: 'lunch' });
  await assert.rejects(writeMeal(meal));
});

test('saved suggestions and meal details use the new collection routes', async () => {
  request = async (path) => {
    assert.equal(path, '/api/v1/suggestions');
    return [suggestionResponse({
      id: '301', meal_id: '500', origin_food_id: '1',
      what_to_try: 'Try a small serving', why_this_may_help: 'Familiar food',
      status: 'SAVED', saved_at: '2026-10-21T08:00:00Z', created_at: '2026-10-21T07:00:00Z',
    }), suggestionResponse({ id: '302', meal_id: '500', origin_food_id: '1', status: 'TRIED' })];
  };
  const saved = await listSavedSuggestions();
  assert.equal(saved[0].whatToTry, 'Try a small serving');
  assert.deepEqual(saved.map(item => item.status), ['saved', 'tried']);
  request = async (path) => {
    assert.equal(path, '/api/v1/meals');
    return [{ id: '500', user_id: '1', meal_date: '2026-10-20', meal_type: 'LUNCH', setting: 'HOME', before_photo_uri: null, after_photo_uri: null, saved_at: '2026-10-20T08:00:00Z', foods: [{ id: '1', meal_id: '500', name: 'Potato', ingredients: [{ id: '212', name: 'Potato', outcome: null, difficulty_reasons: [] }], cooking_method: null, serving_note: null, acceptance: null, outcome: null, difficulty_reasons: [], recommendation_tries: [] }] }];
  };
  const meals = await listMealDetails();
  assert.equal(meals[0].mealDate, '2026-10-20');
  assert.equal(meals[0].mealType, 'lunch');
  assert.equal(meals[0].foods[0].name, 'Potato');
  assert.equal(meals[0].review, null);
  assert.deepEqual(meals[0].suggestionLinks, []);
});
