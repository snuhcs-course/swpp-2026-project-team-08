// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 삭제된 재료 카탈로그 API 검증 제거, 서버 발급 id·대문자 enum 저장 계약으로 수정
// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 식사 입력의 조리법 ID 저장 검증
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 식사 저장 요청·응답 검증을 완료 행동 Unit으로 이동
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

let request;

const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules((name) => {
  if (name.endsWith('/network/apiClient')) return { apiRequest: (...params) => request(...params) };
  return undefined;
});

const { listSavedSuggestions } = require('../../src/data/api/savedSuggestionListApi.ts');

const { listMealDetails } = require('../../src/data/api/mealReadApi.ts');

const { suggestionResponse } = require('../fixtures/server-suggestion.cjs');

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
