// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Ingredient difficulty API save and restore coverage
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식·재료 안 리뷰 결과, 난이도 사유 문자열, 기존 음식 id 갱신 계약으로 수정
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 재료 난이도 저장·복원 테스트를 서버 난이도 사유 문자열 기준으로 수정
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
  id: '8', user_id: '1', meal_date: '2026-10-21', meal_type: 'LUNCH', setting: 'HOME',
  before_photo_uri: null, after_photo_uri: null, saved_at: '2026-10-21T00:00:00Z',
  foods: [{ id: '2', meal_id: '8', name: 'Potato',
    ingredients: [{ id: '212', name: 'Potato', outcome: null, difficulty_reasons: [] }],
    cooking_method: null, serving_note: null, acceptance: null,
    outcome: null, difficulty_reasons: [], recommendation_tries: [] }],
};

test('review meal loads by ID and maps server ingredient IDs into review request', async () => {
  request = async (path) => {
    assert.equal(path, '/api/v1/meals/8');
    return response;
  };
  const detail = await getMealDetail('8');
  assert.equal(detail.review, null);
  assert.equal(toLegacyMeal(detail).foods[0].ingredients[0], 'Potato');
  const review = {
    mealId: '8', childId: '1', afterPhoto: null, comparisonMethod: 'manual', savedAt: '2026-10-21T00:00:00Z',
    suggestionFeedback: {},
    difficulties: { 2: [
      { id: 'a', category: 'texture', subcategory: 'hardness', value: 'hard' },
      { id: 'b', category: 'color', value: 'other', note: 'speckled' },
      { id: 'c', category: 'color', value: 'other', note: 'another note' },
    ] },
    outcomes: [{ foodId: '2', decision: { confirmed: 'eaten', suggested: null },
      ingredients: [{ id: '2:potato', name: 'Potato', selected: true,
        decision: { confirmed: 'tasted', suggested: null } }] }],
  };
  assert.equal(prepareReviewWrite(review, detail).foodResults[0].ingredientOutcomes[0].ingredientId, '212');
  let wrote = false;
  request = async (path, init) => {
    assert.equal(path, '/api/v1/meals/8/review');
    assert.equal(init.method, 'PUT');
    const [food] = JSON.parse(init.body).food_results;
    assert.equal(food.outcome, 'EATEN');
    // 메모는 보내지 않고, 같은 사유는 한 번만 보낸다.
    assert.deepEqual(food.difficulty_reasons, ['TEXTURE.HARDNESS.HARD', 'COLOR.OTHER']);
    assert.deepEqual(food.ingredient_outcomes, [
      { ingredient_id: '212', outcome: 'TASTED', difficulty_reasons: [] },
    ]);
    wrote = true;
    return reviewResponse(response, JSON.parse(init.body));
  };
  const saved = await writeMealReview(review, detail);
  assert.equal(saved.review.foodResults[0].outcome, 'eaten');
  assert.deepEqual(saved.review.foodResults[0].difficulties, [
    { category: 'texture', subcategory: 'hardness', value: 'hard' },
    { category: 'color', subcategory: null, value: 'other' },
  ]);
  assert.deepEqual(saved.review.ingredientResults, [{
    mealId: '8', foodId: '2', ingredientId: '212', outcome: 'tasted', difficulties: [],
  }]);
  assert.equal(wrote, true);
});

test('food edit sends IDs only for existing foods and maps the new food to its server ID', async () => {
  request = async (path, init) => {
    assert.equal(path, '/api/v1/meals/8/foods');
    assert.equal(init.method, 'PUT');
    const foods = JSON.parse(init.body).foods;
    assert.deepEqual(foods.map((food) => food.id), ['1', undefined]);
    assert.deepEqual(foods[1].ingredients, [{ name: 'Potato' }]);
    return { ...response, foods: [
      { ...response.foods[0], id: '1', name: 'Rice', ingredients: [] },
      { ...response.foods[0], id: '3', name: 'Potato' },
    ] };
  };
  const foods = [
    { id: '1', name: 'Rice', ingredients: [], preparation: '', servingNote: '', source: 'parent', confirmed: true },
    { id: 'new-food', name: 'Potato', ingredients: ['Potato'], preparation: '', servingNote: '', source: 'parent', confirmed: true },
  ];
  const result = await updateReviewMealFoods('8', foods, ['1', '2']);
  assert.equal(result.foodIdMap.get('1'), '1');
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
  draft.difficulties['2'] = addDifficulty([], 'smell', 'herb');
  draft.difficulties[ingredientId] = addDifficulty([], 'texture', 'firm', '', 'hardness');
  const review = reviewFromDraft(draft, meal);
  request = async (_path, init) => {
    const body = JSON.parse(init.body);
    assert.deepEqual(body.food_results[0].difficulty_reasons, ['SMELL.HERB']);
    assert.deepEqual(body.food_results[0].ingredient_outcomes, [{ ingredient_id: '212', outcome: 'UNTOUCHED',
      difficulty_reasons: ['TEXTURE.HARDNESS.FIRM'] }]);
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

test('an unreviewed meal and a reviewed meal map to the matching review state', async () => {
  request = async () => response;
  assert.equal((await getMealDetail('8')).review, null);
  request = async () => reviewResponse(response, { after_photo_uri: null, food_results: [
    { food_id: '2', outcome: 'UNCLEAR', difficulty_reasons: ['NOT_SURE'], ingredient_outcomes: [] },
  ] });
  const reviewed = await getMealDetail('8');
  assert.equal(reviewed.review.foodResults[0].outcome, 'unclear');
  assert.deepEqual(reviewed.review.foodResults[0].difficulties,
    [{ category: 'notSure', subcategory: null, value: 'notSure' }]);
  assert.deepEqual(reviewed.review.ingredientResults, []);
});

test('responses with old lowercase values or unknown difficulty reasons are rejected', async () => {
  for (const change of [
    { meal_type: 'lunch' },
    { setting: 'home' },
    { foods: [{ ...response.foods[0], cooking_method: 'boiled' }] },
    { foods: [{ ...response.foods[0], outcome: 'eaten' }] },
    { foods: [{ ...response.foods[0], outcome: 'EATEN', difficulty_reasons: ['SHAPE.VARIED'] }] },
    { foods: [{ ...response.foods[0], outcome: 'EATEN', difficulty_reasons: [{ category: 'color' }] }] },
  ]) {
    request = async () => ({ ...response, ...change });
    await assert.rejects(getMealDetail('8'));
  }
});
