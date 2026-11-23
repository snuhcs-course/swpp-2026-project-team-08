// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 삭제된 재료 카탈로그 API 검증 제거, 서버 발급 id·대문자 enum 저장 계약으로 수정
// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 식사 입력의 조리법 ID 저장 검증
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 식사 저장 요청·응답 검증을 완료 행동 Unit으로 이동
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 저장 추천 조회와 식사 목록 API 검증 분리
const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

let request;

const { mockModules } = require('../../helpers/mock-modules.cjs');

mockModules((name) => {
  if (name.endsWith('/network/apiClient')) return { apiRequest: (...params) => request(...params) };
  return undefined;
});

const { listMealDetails } = require('../../../src/data/api/mealReadApi.ts');

test('식사 목록 조회는 현재 API 경로에서 식사 정보와 미검토 상태를 읽는다', async () => {
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
