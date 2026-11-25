// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 삭제된 재료 카탈로그 API 검증 제거, 서버 발급 id·대문자 enum 저장 계약으로 수정
// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 식사 입력의 조리법 ID 저장 검증
// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 식사 저장 요청·응답 검증을 완료 행동 Unit으로 이동
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 저장 추천 조회와 식사 목록 API 검증 분리
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 원본이 있는 추천과 없는 추천의 음식명 확인
const { test } = require('node:test');
const assert = require('node:assert/strict');

require('../../helpers/register.cjs');

let request;

const { mockModules } = require('../../helpers/mock-modules.cjs');

mockModules((name) => {
  if (name.endsWith('/network/apiClient')) return { apiRequest: (...params) => request(...params) };
  return undefined;
});

const { listSavedSuggestions } = require('../../../src/data/api/savedSuggestionListApi.ts');

const { suggestionResponse } = require('../../fixtures/server-suggestion.cjs');

test('저장 추천 조회는 현재 API 경로에서 Saved와 Tried 상태를 읽는다', async () => {
  request = async (path) => {
    assert.equal(path, '/api/v1/suggestions');
    return [suggestionResponse({
      id: '301', meal_id: '500', origin_food_id: '1', food_name: 'Rice',
      what_to_try: 'Try a small serving', why_this_may_help: 'Familiar food',
      status: 'SAVED', saved_at: '2026-10-21T08:00:00Z', created_at: '2026-10-21T07:00:00Z',
    }), suggestionResponse({ id: '302', meal_id: null, origin_food_id: null, food_name: 'Bean soup', status: 'TRIED' })];
  };
  const saved = await listSavedSuggestions();
  assert.equal(saved[0].whatToTry, 'Try a small serving');
  assert.deepEqual(saved.map(({ status, foodName, mealId, foodId }) => [status, foodName, mealId, foodId]), [
    ['saved', 'Rice', '500', '1'], ['tried', 'Bean soup', null, null],
  ]);
});

test('저장 추천 응답에 음식명이 빠지면 목록 조회를 실패로 처리한다', async () => {
  request = async () => [suggestionResponse({ status: 'SAVED', food_name: undefined })];
  await assert.rejects(listSavedSuggestions(), /Invalid API string/);
});
