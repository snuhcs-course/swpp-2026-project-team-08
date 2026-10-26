// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');

let request;

const { mockModules } = require('../helpers/mock-modules.cjs');
const restoreMocks = mockModules((name) => {
  if (name.endsWith('/network/apiClient')) return { apiRequest: (...params) => request(...params) };
  return undefined;
});

const api = require('../../src/data/api/mealSuggestionApi.ts');

const { reviewedSuggestionTargets, unGeneratedTargets } = require('../../src/features/suggestions/rules.ts');

restoreMocks();

const suggestion = {
  id: '31', user_id: '1', meal_id: '8', food_id: '2', ingredient_id: '212',
  food_snapshot: { name: 'Potato stew', ingredients: [{ id: '212', name: 'Potato' }],
    cooking_method: null, serving_note: null, acceptance: null },
  what_to_try: 'Try a little', why_this_may_help: 'Familiar texture', serving_tip: null,
  status: 'pending', dismiss_reasons: [], saved_at: null, created_at: '2026-10-21T00:00:00Z',
};

test('meal suggestions list includes all statuses and generation sends food plus ingredient targets', async () => {
  request = async (path) => {
    assert.equal(path, '/api/v1/meals/8/suggestions?status=all');
    return [suggestion];
  };
  assert.equal((await api.listMealSuggestions('1', '8'))[0].ingredientId, '212');
  request = async (path, init) => {
    assert.equal(path, '/api/v1/meals/8/suggestions');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { targets: [
      { food_id: '2', ingredient_id: null }, { food_id: '2', ingredient_id: '212' },
    ] });
    return [{ ...suggestion, id: '30', ingredient_id: null }, suggestion];
  };
  const items = await api.generateMealSuggestions('1', '8', [
    { foodId: '2', ingredientId: null }, { foodId: '2', ingredientId: '212' },
  ]);
  assert.deepEqual(items.map(item => [item.id, item.ingredientId]), [['30', null], ['31', '212']]);
});

test('saved, dismissed, and undo decisions use the v1 decision route', async () => {
  request = async (path, init) => {
    assert.equal(path, '/api/v1/suggestions/31/decision');
    assert.equal(init.method, 'PUT');
    assert.deepEqual(JSON.parse(init.body), { status: 'dismissed', dismiss_reasons: ['already_tried'] });
    return { ...suggestion, status: 'dismissed', dismiss_reasons: ['already_tried'] };
  };
  assert.equal((await api.decideMealSuggestion('1', '31', 'dismissed', ['already_tried'])).status, 'dismissed');
  request = async (path, init) => {
    assert.equal(path, '/api/v1/suggestions/31/decision');
    assert.equal(init.method, 'DELETE');
    return suggestion;
  };
  assert.equal((await api.undoMealSuggestion('1', '31')).status, 'pending');
  await assert.rejects(api.decideMealSuggestion('1', '31', 'dismissed'), /Invalid suggestion decision/);
});

test('target choices contain reviewed food and ingredient targets only', () => {
  const meal = { foods: [{ id: '2', name: 'Potato stew', ingredients: [
    { id: '212', name: 'Potato' }, { id: '182', name: 'Carrot' },
  ] }], review: { foodResults: [{ foodId: '2' }], ingredientResults: [
    { foodId: '2', ingredientId: '212' },
  ] } };
  assert.deepEqual(reviewedSuggestionTargets(meal).map((item) => item.target), [
    { foodId: '2', ingredientId: null }, { foodId: '2', ingredientId: '212' },
  ]);
  assert.deepEqual(reviewedSuggestionTargets({ ...meal, review: null }), []);
  assert.deepEqual(unGeneratedTargets(reviewedSuggestionTargets(meal), [{
    foodId: '2', ingredientId: '212',
  }]).map((item) => item.target), [{ foodId: '2', ingredientId: null }]);
});
