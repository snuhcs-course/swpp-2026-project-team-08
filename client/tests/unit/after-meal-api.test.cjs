// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Ingredient difficulty API coverage and selection/note round trips
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

test('ingredient difficulties survive API saving and restore to their own review targets', async () => {
  const { newReviewDraft, setOutcome, addDifficulty, reviewFromDraft, reviewDraftFromServer } =
    require('../../src/features/after-meal-review/rules.ts');
  const { toMealDetail } = require('../../src/data/dto/mealDto.ts');
  const detail = toMealDetail(response);
  const meal = toLegacyMeal(detail);
  const draft = newReviewDraft(meal);
  const ingredientId = draft.outcomes[0].ingredients[0].id;
  draft.outcomes = setOutcome(draft.outcomes, '2', 'tasted');
  draft.outcomes = setOutcome(draft.outcomes, '2', 'untouched', ingredientId);
  draft.difficulties['2'] = addDifficulty([], 'smell', 'mint');
  draft.difficulties[ingredientId] = addDifficulty([], 'texture', 'firm', '', 'hardness');
  const review = reviewFromDraft(draft, meal);
  request = async (_path, init) => {
    const body = JSON.parse(init.body);
    assert.deepEqual(body.food_results[0].difficulties, [{ category: 'smell', subcategory: null, value: 'mint' }]);
    assert.deepEqual(body.food_results[0].ingredient_outcomes, [{ ingredient_id: '212', outcome: 'untouched',
      difficulties: [{ category: 'texture', subcategory: 'hardness', value: 'firm' }] }]);
    return reviewResponse(response, body);
  };
  const saved = await writeMealReview(review, detail);
  const restored = reviewDraftFromServer(meal, saved);
  assert.equal(restored.outcomes[0].ingredients[0].selected, true);
  assert.equal(restored.difficulties[ingredientId][0].category, 'texture');
  assert.equal(restored.difficulties[ingredientId][0].subcategory, 'hardness');
  assert.equal(restored.difficulties[ingredientId][0].value, 'firm');
  assert.equal(restored.difficulties['2'][0].category, 'smell');
  assert.deepEqual(prepareReviewWrite(reviewFromDraft(restored, meal), saved), prepareReviewWrite(review, detail));
});

for (const [category, value, note, subcategory] of [
  ['tasteType', 'other', '낯선 맛'],
  ['color', 'other', '보라색'],
  ['arrangement', 'other', '소스: 한쪽에 몰림\n음식 위에 있음'],
  ['shape', 'note', '길쭉한 모양'],
  ['shape', 'notSure', '모양 확인 필요'],
  ['texture', 'firm', '씹기 어려움', 'hardness'],
]) {
  test(`${category}/${value}: food and ingredient selections and notes survive repeated API saves`, async () => {
    const { newReviewDraft, setOutcome, addDifficulty, reviewFromDraft, reviewDraftFromServer } =
      require('../../src/features/after-meal-review/rules.ts');
    const { toMealDetail } = require('../../src/data/dto/mealDto.ts');
    let detail = toMealDetail(response);
    const meal = toLegacyMeal(detail);
    let draft = newReviewDraft(meal);
    const ingredientId = draft.outcomes[0].ingredients[0].id;
    draft.outcomes = setOutcome(draft.outcomes, '2', 'tasted');
    draft.outcomes = setOutcome(draft.outcomes, '2', 'untouched', ingredientId);
    for (const targetId of ['2', ingredientId]) {
      draft.difficulties[targetId] = addDifficulty([], category, value, note, subcategory);
    }
    const original = prepareReviewWrite(reviewFromDraft(draft, meal), detail);
    request = async (path, init) => {
      assert.equal(path, '/api/v1/meals/8/review');
      const body = JSON.parse(init.body);
      const expected = { category, subcategory: subcategory ?? null, value: `${value}: ${note}` };
      assert.deepEqual(body.food_results[0].difficulties, [expected]);
      assert.deepEqual(body.food_results[0].ingredient_outcomes[0].difficulties, [expected]);
      return reviewResponse(response, body);
    };
    for (let save = 0; save < 2; save++) {
      detail = await writeMealReview(reviewFromDraft(draft, meal), detail);
      draft = reviewDraftFromServer(meal, detail);
      for (const targetId of ['2', ingredientId]) {
        const [tag] = draft.difficulties[targetId];
        assert.equal(tag.category, category);
        assert.equal(tag.value, value);
        assert.equal(tag.note, note);
        assert.equal(tag.subcategory, subcategory);
      }
      assert.deepEqual(prepareReviewWrite(reviewFromDraft(draft, meal), detail), original);
    }
  });
}
