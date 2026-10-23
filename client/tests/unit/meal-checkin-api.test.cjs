// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
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

const { listIngredientCatalog } = require('../../src/data/api/ingredientCatalogApi.ts');

const { listSavedSuggestions } = require('../../src/data/api/savedSuggestionListApi.ts');

const { listMealDetails } = require('../../src/data/api/mealReadApi.ts');

const meal = {
  id: 'local-draft', childId: '1', mealDate: '2026-10-21', mealType: 'lunch',
  setting: 'home', photo: null, savedAt: '2026-10-21T00:00:00Z',
  foods: [
    { id: 'local-food-a', name: 'Potato', ingredients: ['Potato'], preparation: '삶기', servingNote: '', source: 'parent', confirmed: true, acceptance: 1 },
    { id: 'local-food-b', name: 'Carrot', ingredients: ['Carrot'], preparation: '', servingNote: '', source: 'parent', confirmed: true, acceptance: null },
  ],
  suggestionLinks: [{ suggestionId: '301', foodId: 'local-food-b', title: 'Try carrot', description: 'Small serving' }],
};

test('meal write maps draft food IDs and saved suggestion links to the new contract', async () => {
  const { body } = prepareMealWrite(meal);
  assert.deepEqual(body.foods.map((food) => food.id), ['1', '2']);
  assert.equal(body.foods[0].cooking_method, 'boiled');
  assert.deepEqual(body.foods[0].ingredients, [{ id: null, name: 'Potato' }]);
  assert.deepEqual(body.suggestion_links, [{ suggestion_id: '301', food_id: '2', ingredient_id: null }]);
  request = async (path, init) => {
    assert.equal(path, '/api/v1/meals');
    assert.equal(init.method, 'PUT');
    assert.deepEqual(JSON.parse(init.body), body);
    return { id: '502', user_id: '1', meal_date: '2026-10-21', meal_type: 'lunch', setting: 'home', before_photo_uri: null, after_photo_uri: null, saved_at: '2026-10-21T08:00:00Z' };
  };
  const saved = await writeMeal(meal);
  assert.equal(saved.id, '502');
  assert.deepEqual(saved.foods.map((food) => food.id), ['1', '2']);
  assert.equal(saved.suggestionLinks[0].foodId, '2');
  const ingredientLink = prepareMealWrite({
    ...meal,
    suggestionLinks: [{ ...meal.suggestionLinks[0], ingredientId: '212' }],
  });
  assert.equal(ingredientLink.body.suggestion_links[0].ingredient_id, '212');
});

test('ingredient catalog and saved suggestions use the new collection routes', async () => {
  request = async (path) => {
    assert.equal(path, '/api/v1/ingredients');
    return [{ id: '212', name: 'Potato' }];
  };
  assert.deepEqual(await listIngredientCatalog(), [{ id: '212', name: 'Potato' }]);
  request = async (path) => {
    assert.equal(path, '/api/v1/suggestions');
    return [{
      id: '301', user_id: '1', meal_id: '500', food_id: '1', ingredient_id: null,
      food_snapshot: { name: 'Potato', ingredients: [{ id: '212', name: 'Potato' }], cooking_method: null, serving_note: null, acceptance: null },
      what_to_try: 'Try a small serving', why_this_may_help: 'Familiar food', serving_tip: null,
      status: 'saved', dismiss_reasons: [], saved_at: '2026-10-21T08:00:00Z', created_at: '2026-10-21T07:00:00Z',
    }];
  };
  assert.equal((await listSavedSuggestions())[0].foodSnapshot.name, 'Potato');
  request = async (path) => {
    assert.equal(path, '/api/v1/meals');
    return [{ id: '500', user_id: '1', meal_date: '2026-10-20', meal_type: 'lunch', setting: 'home', before_photo_uri: null, after_photo_uri: null, saved_at: '2026-10-20T08:00:00Z', foods: [], review: null, suggestion_links: [] }];
  };
  assert.equal((await listMealDetails())[0].mealDate, '2026-10-20');
});
