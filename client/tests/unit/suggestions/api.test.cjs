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
// Changed: 홈 추천 생성·재생성 요청과 잔여 횟수, 사유 없는 제외 검증
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 재생성 ID·잔여 횟수 없는 추천 한 장 생성과 준비 방법 필드 검증
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

test('홈 추천 요청은 본문 없이 보내고 현재 아이의 카드 한 장을 받는다', async t => {
  const controller = new AbortController();
  t.mock.method(AbortSignal, 'timeout', milliseconds => {
    // 서버의 LLM 생성 대기 시간(60초)보다 길게 기다린다.
    assert.equal(milliseconds, 70_000);
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
  assert.equal(item.whatToTry, 'Try a little');
  assert.equal(item.whyThisMayHelp, 'Familiar texture');
  assert.deepEqual(item.ingredients, ['Potato']);
  assert.equal(item.preparationMethod, 'Offer a small portion.');
});

test('현재 아이의 완전한 새 카드 하나만 표시한다', async () => {
  for (const fields of [
    { user_id: '2' }, { status: 'SAVED' }, { status: 'pending' },
    { ingredients: 'Potato' }, { ingredients: [] }, { ingredients: [' '] },
    { preparation_method: null }, { preparation_method: ' ' },
    { what_to_try: ' ' }, { why_this_may_help: ' ' },
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
    assert.deepEqual(JSON.parse(init.body), { status: 'DISMISSED', dismiss_reasons: [] });
    return { ...suggestion, status: 'DISMISSED', dismiss_reasons: [] };
  };
  const dismissed = await api.decideSuggestion('1', '31', 'dismissed');
  assert.equal(dismissed.status, 'dismissed');
  assert.deepEqual(dismissed.dismissReasons, []);
  request = async (path, init) => {
    assert.equal(path, '/api/v1/suggestions/31/decision');
    assert.equal(init.method, 'DELETE');
    return suggestion;
  };
  assert.equal((await api.undoSuggestion('1', '31')).status, 'pending');
  await assert.rejects(api.decideSuggestion('1', '31', 'saved', ['dislike']), /Invalid suggestion decision/);
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
