const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  filename,
);
let request;
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name.endsWith('/network/apiClient')) return { apiRequest: (...params) => request(...params) };
  return originalLoad.call(this, name, ...args);
};
const { toMealDetail } = require('../src/data/dto/mealDto.ts');
const { toLegacyMeal } = require('../src/data/dto/mealLegacyDto.ts');
const { getMealDetail } = require('../src/data/api/mealReadApi.ts');
const { updateReviewMealFoods } = require('../src/data/api/mealFoodsApi.ts');
const { prepareReviewWrite, writeMealReview } = require('../src/data/api/mealReviewApi.ts');
Module._load = originalLoad;

const response = {
  id: '8', user_id: '1', meal_date: '2026-10-21', meal_type: 'lunch', setting: 'home',
  before_photo_uri: null, after_photo_uri: null, saved_at: '2026-10-21T00:00:00Z',
  foods: [{ id: '2', meal_id: '8', name: 'Potato', ingredients: [{ id: '212', name: 'Potato' }],
    cooking_method: null, serving_note: null, acceptance: null }],
  review: null, suggestion_links: [],
};

test('review meal loads by ID and maps server ingredient IDs into review request', async () => {
  request = async (path) => {
    assert.equal(path, '/api/v1/meals/8');
    return response;
  };
  const detail = await getMealDetail('8');
  assert.equal(toLegacyMeal(detail).foods[0].ingredients[0], 'Potato');
  const review = {
    mealId: '8', childId: '1', afterPhoto: null, comparisonMethod: 'manual', savedAt: '2026-10-21T00:00:00Z',
    suggestionFeedback: {}, difficulties: {},
    outcomes: [{ foodId: '2', decision: { confirmed: 'eaten', suggested: null },
      ingredients: [{ id: '2:potato', name: 'Potato', selected: true,
        decision: { confirmed: 'tasted', suggested: null } }] }],
  };
  assert.equal(prepareReviewWrite(review, detail).foodResults[0].ingredientOutcomes[0].ingredientId, '212');
  let wrote = false;
  request = async (path, init) => {
    if (path === '/api/v1/meals/8') return { ...response, review: {
      food_results: [{ meal_id: '8', food_id: '2', food_snapshot: {
        name: 'Potato', ingredients: [{ id: '212', name: 'Potato' }], cooking_method: null,
        serving_note: null, acceptance: null }, outcome: 'eaten', difficulties: [] }],
      ingredient_results: [{ meal_id: '8', food_id: '2', ingredient_id: '212', outcome: 'tasted', difficulties: [] }],
    } };
    assert.equal(path, '/api/v1/meals/8/review');
    assert.equal(init.method, 'PUT');
    assert.equal(JSON.parse(init.body).food_results[0].ingredient_outcomes[0].ingredient_id, '212');
    wrote = true;
    return { meal: response, food_results: [{ meal_id: '8', food_id: '2', food_snapshot: {
      name: 'Potato', ingredients: [{ id: '212', name: 'Potato' }], cooking_method: null,
      serving_note: null, acceptance: null }, outcome: 'eaten', difficulties: [] }], ingredient_results: [] };
  };
  assert.equal((await writeMealReview(review, detail)).review.foodResults[0].outcome, 'eaten');
  assert.equal(wrote, true);
});

test('food edit assigns a fresh ID after deleted food and sends the whole food list', async () => {
  request = async (path, init) => {
    assert.equal(path, '/api/v1/meals/8/foods');
    assert.equal(init.method, 'PUT');
    const foods = JSON.parse(init.body).foods;
    assert.deepEqual(foods.map((food) => food.id), ['1', '3']);
    return { ...response, foods: foods.map((food) => ({ ...food, meal_id: '8',
      ingredients: food.ingredients.map((item) => ({ id: '212', name: item.name })) })) };
  };
  const foods = [
    { id: '1', name: 'Rice', ingredients: ['Rice'], preparation: '', servingNote: '', source: 'parent', confirmed: true },
    { id: 'new-food', name: 'Potato', ingredients: ['Potato'], preparation: '', servingNote: '', source: 'parent', confirmed: true },
  ];
  const result = await updateReviewMealFoods('8', foods, ['1', '2']);
  assert.equal(result.foodIdMap.get('new-food'), '3');
});
