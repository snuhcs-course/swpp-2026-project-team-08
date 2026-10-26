// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { reviewResponse } = require('../fixtures/server-meal.cjs');

let request;

const { mockModules } = require('../helpers/mock-modules.cjs');
const restoreMocks = mockModules((name) => {
  if (name.endsWith('/network/apiClient')) return { apiRequest: (...params) => request(...params) };
  return undefined;
});

const { toLegacyMeal } = require('../../src/data/dto/mealLegacyDto.ts');

const { getMealDetail } = require('../../src/data/api/mealReadApi.ts');

const { updateReviewMealFoods } = require('../../src/data/api/mealFoodsApi.ts');

const { prepareReviewWrite, writeMealReview } = require('../../src/data/api/mealReviewApi.ts');

restoreMocks();

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
    assert.equal(path, '/api/v1/meals/8/review');
    assert.equal(init.method, 'PUT');
    assert.equal(JSON.parse(init.body).food_results[0].ingredient_outcomes[0].ingredient_id, '212');
    wrote = true;
    return reviewResponse(response, JSON.parse(init.body));
  };
  const saved = await writeMealReview(review, detail);
  assert.equal(saved.review.foodResults[0].outcome, 'eaten');
  assert.deepEqual(saved.review.ingredientResults, [{
    mealId: '8', foodId: '2', ingredientId: '212', outcome: 'tasted', difficulties: [],
  }]);
  assert.equal(wrote, true);
});

test('food edit assigns a fresh ID after deleted food and sends the whole food list', async () => {
  request = async (path, init) => {
    assert.equal(path, '/api/v1/meals/8/foods');
    assert.equal(init.method, 'PUT');
    const foods = JSON.parse(init.body).foods;
    assert.deepEqual(foods.map((food) => food.id), ['1', '3']);
    return { ...response, foods: foods.map((food) => ({ ...food, meal_id: '8',
      ingredients: food.ingredients.map((item) => ({ id: item.name === 'Rice' ? '211' : '212', name: item.name })) })) };
  };
  const foods = [
    { id: '1', name: 'Rice', ingredients: ['Rice'], preparation: '', servingNote: '', source: 'parent', confirmed: true },
    { id: 'new-food', name: 'Potato', ingredients: ['Potato'], preparation: '', servingNote: '', source: 'parent', confirmed: true },
  ];
  const result = await updateReviewMealFoods('8', foods, ['1', '2']);
  assert.equal(result.foodIdMap.get('new-food'), '3');
});
