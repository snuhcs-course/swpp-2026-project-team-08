// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Verify target choices exclude tracked ingredients
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천, 대문자 상태·사유·조회 필터 계약으로 수정
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 최초 생성 재요청 시 기존 카드 상태 재사용 검증
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 추천 API 검증 이동 및 생성 실패 시 입력 보존 중복 검증 통합
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 추천 한 장의 요청·본문 검증 및 결정 계약 확인
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { homeSuggestionResponse } = require('../../fixtures/server-suggestion.cjs');

let request;

const { mockModules } = require('../../helpers/mock-modules.cjs');
const restoreMocks = mockModules((name) => {
  if (name.endsWith('/network/apiClient')) return { apiRequest: (...params) => request(...params) };
  return undefined;
});

const api = require('../../../src/data/api/suggestionApi.ts');

restoreMocks();

const suggestion = homeSuggestionResponse();

test('홈 추천 요청은 식사나 음식 ID 없이 현재 아이의 카드 한 장을 받는다', async t => {
  const controller = new AbortController();
  t.mock.method(AbortSignal, 'timeout', milliseconds => {
    assert.equal(milliseconds, 10_000);
    return controller.signal;
  });
  request = async (path, init) => {
    assert.equal(path, '/api/v1/suggestions');
    assert.equal(init.method, 'POST');
    assert.equal(init.body, undefined);
    assert.equal(init.signal, controller.signal);
    return suggestion;
  };
  const item = await api.generateSuggestion('1');
  assert.equal(item.status, 'pending');
  assert.equal(item.foodName, 'Rice');
  assert.equal(item.mealId, null);
  assert.equal(item.foodId, null);
  assert.deepEqual(item.ingredients, ['Potato']);
  assert.equal(item.cookingMethod, 'steamed');
  assert.equal(item.causes, suggestion.causes);
});

test('현재 아이의 완전한 새 카드 하나만 표시한다', async () => {
  for (const fields of [
    { user_id: '2' }, { meal_id: '8' }, { origin_food_id: '2' }, { status: 'SAVED' },
    { status: 'pending' }, { cooking_method: 'steamed' }, { origin_food_id: undefined },
    { cooking_method: null }, { ingredients: 'Potato' }, { ingredients: [] }, { ingredients: [' '] },
    { causes: undefined }, { serving_tip: null }, { food_name: '' }, { what_to_try: ' ' },
    { why_this_may_help: ' ' },
  ]) {
    request = async () => ({ ...suggestion, ...fields });
    await assert.rejects(api.generateSuggestion('1'), undefined, JSON.stringify(fields));
  }
  for (const value of [null, [], [suggestion]]) {
    request = async () => value;
    await assert.rejects(api.generateSuggestion('1'));
  }
});

test('saved, dismissed, and undo decisions use the v1 decision route', async () => {
  request = async (path, init) => {
    assert.equal(path, '/api/v1/suggestions/31/decision');
    assert.equal(init.method, 'PUT');
    assert.deepEqual(JSON.parse(init.body), { status: 'DISMISSED', dismiss_reasons: ['ALREADY_TRIED'] });
    return { ...suggestion, status: 'DISMISSED', dismiss_reasons: ['ALREADY_TRIED'] };
  };
  const dismissed = await api.decideSuggestion('1', '31', 'dismissed', ['already_tried']);
  assert.equal(dismissed.status, 'dismissed');
  assert.deepEqual(dismissed.dismissReasons, ['already_tried']);
  request = async (path, init) => {
    assert.equal(path, '/api/v1/suggestions/31/decision');
    assert.equal(init.method, 'DELETE');
    return suggestion;
  };
  assert.equal((await api.undoSuggestion('1', '31')).status, 'pending');
  await assert.rejects(api.decideSuggestion('1', '31', 'dismissed'), /Invalid suggestion decision/);
});

test('every dismiss reason maps to a server value and old values are rejected', async () => {
  const pairs = [
    ['restriction', 'RESTRICTION'], ['dislike', 'DISLIKE'], ['not_fit', 'NOT_FIT'],
    ['too_much_preparation', 'TOO_MUCH_PREPARATION'],
    ['ingredient_hard_to_get', 'INGREDIENT_HARD_TO_GET'], ['already_tried', 'ALREADY_TRIED'],
  ];
  for (const [reason, value] of pairs) {
    request = async (path, init) => {
      assert.deepEqual(JSON.parse(init.body).dismiss_reasons, [value]);
      return { ...suggestion, status: 'DISMISSED', dismiss_reasons: [value] };
    };
    const result = await api.decideSuggestion('1', '31', 'dismissed', [reason]);
    assert.deepEqual(result.dismissReasons, [reason]);
  }
  await assert.rejects(api.decideSuggestion('1', '31', 'dismissed', ['restriction_conflict']));
  request = async () => ({ ...suggestion, status: 'DISMISSED', dismiss_reasons: ['restriction_conflict'] });
  await assert.rejects(api.decideSuggestion('1', '31', 'dismissed', ['restriction']));
});
