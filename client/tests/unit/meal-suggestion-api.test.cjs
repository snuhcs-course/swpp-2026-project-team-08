// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Verify target choices exclude tracked ingredients
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천, 대문자 상태·사유·조회 필터 계약으로 수정
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { suggestionResponse } = require('../fixtures/server-suggestion.cjs');

let request;

const { mockModules } = require('../helpers/mock-modules.cjs');
const restoreMocks = mockModules((name) => {
  if (name.endsWith('/network/apiClient')) return { apiRequest: (...params) => request(...params) };
  return undefined;
});

const api = require('../../src/data/api/mealSuggestionApi.ts');

const { reviewedSuggestionTargets, unGeneratedTargets } = require('../../src/features/suggestions/rules.ts');

restoreMocks();

const suggestion = suggestionResponse();

test('meal suggestions list includes all statuses and generation sends food targets only', async () => {
  request = async (path) => {
    assert.equal(path, '/api/v1/meals/8/suggestions?status=ALL');
    return [suggestion];
  };
  const [listed] = await api.listMealSuggestions('1', '8');
  assert.equal(listed.foodId, '2');
  assert.equal('ingredientId' in listed, false);
  assert.deepEqual(listed.ingredients, ['Potato']);
  assert.equal(listed.cookingMethod, 'steamed');
  assert.equal(listed.causes, 'The soft texture was hard.');
  assert.equal(listed.status, 'pending');
  request = async (path, init) => {
    assert.equal(path, '/api/v1/meals/8/suggestions');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { targets: [{ food_id: '2' }, { food_id: '3' }] });
    return [suggestion, suggestionResponse({ id: '32', origin_food_id: '3' })];
  };
  const items = await api.generateMealSuggestions('1', '8', [{ foodId: '2' }, { foodId: '3' }]);
  assert.deepEqual(items.map(item => [item.id, item.foodId]), [['31', '2'], ['32', '3']]);
  await assert.rejects(api.generateMealSuggestions('1', '8', [{ foodId: '2' }, { foodId: '2' }]),
    /Duplicate suggestion target/);
});

test('generation rejects a response that does not match the requested foods', async () => {
  request = async () => [suggestionResponse({ origin_food_id: '9' })];
  await assert.rejects(api.generateMealSuggestions('1', '8', [{ foodId: '2' }]), /Mismatched/);
  request = async () => [suggestionResponse({ status: 'SAVED' })];
  await assert.rejects(api.generateMealSuggestions('1', '8', [{ foodId: '2' }]), /Mismatched/);
});

test('saved, dismissed, and undo decisions use the v1 decision route', async () => {
  request = async (path, init) => {
    assert.equal(path, '/api/v1/suggestions/31/decision');
    assert.equal(init.method, 'PUT');
    assert.deepEqual(JSON.parse(init.body), { status: 'DISMISSED', dismiss_reasons: ['ALREADY_TRIED'] });
    return { ...suggestion, status: 'DISMISSED', dismiss_reasons: ['ALREADY_TRIED'] };
  };
  const dismissed = await api.decideMealSuggestion('1', '31', 'dismissed', ['already_tried']);
  assert.equal(dismissed.status, 'dismissed');
  assert.deepEqual(dismissed.dismissReasons, ['already_tried']);
  request = async (path, init) => {
    assert.equal(path, '/api/v1/suggestions/31/decision');
    assert.equal(init.method, 'DELETE');
    return suggestion;
  };
  assert.equal((await api.undoMealSuggestion('1', '31')).status, 'pending');
  await assert.rejects(api.decideMealSuggestion('1', '31', 'dismissed'), /Invalid suggestion decision/);
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
    const result = await api.decideMealSuggestion('1', '31', 'dismissed', [reason]);
    assert.deepEqual(result.dismissReasons, [reason]);
  }
  await assert.rejects(api.decideMealSuggestion('1', '31', 'dismissed', ['restriction_conflict']));
  request = async () => ({ ...suggestion, status: 'DISMISSED', dismiss_reasons: ['restriction_conflict'] });
  await assert.rejects(api.decideMealSuggestion('1', '31', 'dismissed', ['restriction']));
});

test('responses with old lowercase values or the old shape are rejected', async () => {
  for (const change of [
    { status: 'pending' }, { cooking_method: 'steamed' }, { origin_food_id: undefined },
    { ingredients: 'Potato' }, { causes: undefined },
  ]) {
    request = async () => [{ ...suggestion, ...change }];
    await assert.rejects(api.listMealSuggestions('1', '8'));
  }
});

test('target choices contain reviewed foods only and exclude tracked ingredients', () => {
  const meal = { foods: [
    { id: '2', name: 'Potato stew', ingredients: [{ id: '212', name: 'Potato' }, { id: '182', name: 'Carrot' }] },
    { id: '3', name: 'Rice', ingredients: [] },
  ], review: { foodResults: [{ foodId: '2' }, { foodId: '3' }], ingredientResults: [
    { foodId: '2', ingredientId: '212' },
  ] } };
  assert.deepEqual(reviewedSuggestionTargets(meal).map((item) => item.target), [
    { foodId: '2' }, { foodId: '3' },
  ]);
  assert.deepEqual(reviewedSuggestionTargets({ ...meal, review: null }), []);
  assert.deepEqual(unGeneratedTargets(reviewedSuggestionTargets(meal), [{ foodId: '2' }])
    .map((item) => item.target), [{ foodId: '3' }]);
});
