// AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
// Changed: Validate retained recommendation evidence and current server suggestion retry
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Tests legacy evidence compatibility and current API generation; only native storage and HTTP are mocked.
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('./helpers/register.cjs');
require('./helpers/native-boundaries.cjs').nativeBoundaries();
const { newDraft, mealFromDraft } = require('../src/features/meal-checkin/rules.ts');
const { newFood } = require('../src/rules/foodDraft.ts');
const { newReviewDraft, setOutcome, reviewFromDraft } = require('../src/features/after-meal-review/rules.ts');
const { recommendationText } = require('../src/rules/recommendationPresentation.ts');
const { foodFormKey, isCurrentRecommendation } = require('../src/rules/recommendationSafety.ts');
const { generateMealSuggestions } = require('../src/data/api/mealSuggestionApi.ts');

function fixtures(childId = 'child-d') {
  const profile = {
    id: childId, caregiverName: 'Parent', caregiverEmail: 'parent@example.com', childName: 'Child', ageRange: 'toddler',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], familyFoods: [], safeFoods: [], noSafeFoods: true,
    updatedAt: '2026-10-08T00:00:00.000Z',
  };
  const draft = newDraft(childId);
  draft.mealType = 'lunch'; draft.setting = 'home'; draft.step = 'foods';
  draft.foods = [{ ...newFood(), confirmed: true, id: 'food-d', name: 'Rice', ingredients: ['Rice'], preparation: 'boiled', servingNote: 'mixed on plate' }];
  const meal = mealFromDraft(draft);
  const reviewDraft = newReviewDraft(meal);
  reviewDraft.afterPhoto = { id: 'after', uri: 'file:///after.png', mimeType: 'image/png' };
  reviewDraft.outcomes = setOutcome(reviewDraft.outcomes, 'food-d', 'tasted');
  reviewDraft.outcomes = setOutcome(reviewDraft.outcomes, 'food-d', 'tasted', reviewDraft.outcomes[0].ingredients[0].id);
  reviewDraft.difficulties = { 'food-d': [{ id: 'shape:varied', category: 'shape', value: 'varied' }] };
  return { profile, meal, review: reviewFromDraft(reviewDraft, meal) };
}


function savedFor(profile, meal, review) {
  return {
    id: 'legacy-card', childId: profile.id, ingredients: meal.foods[0].ingredients,
    title: 'Try Rice', description: 'Try a small portion', isSaved: true,
    safetyVerifiedForProfileAt: profile.updatedAt,
    recommendation: {
      mealId: meal.id, foodId: 'food-d', foodName: 'Rice',
      foodFormKey: foodFormKey(meal.foods[0]), reviewSavedAt: review.savedAt,
      outcome: 'tasted', difficulty: 'shape', kind: 'small-separate-portion',
    },
  };
}

test('legacy recommendation requires explicit restriction answers and confirmed review evidence', () => {
  const { profile, meal, review } = fixtures();
  const card = savedFor(profile, meal, review);
  assert.equal(isCurrentRecommendation(card, profile, meal, review), true);
  for (const changed of [{ ...profile, allergies: [] }, { ...profile, restrictions: ['dairy'] }]) {
    assert.equal(isCurrentRecommendation(card, changed, meal, review), false);
  }
  const unconfirmed = { ...review, outcomes: [{ ...review.outcomes[0], decision: { confirmed: null, suggested: 'tasted' } }] };
  assert.equal(isCurrentRecommendation(card, profile, meal, unconfirmed), false);
  assert.match(recommendationText(card.recommendation, 'en').description, /was tasted/);
  assert.match(recommendationText(card.recommendation, 'ko').title, /Rice/);
});

test('legacy saved evidence stops being actionable when its owner, safety or serving form changes', () => {
  const { profile, meal, review } = fixtures();
  const card = savedFor(profile, meal, review);
  assert.equal(isCurrentRecommendation(card, profile, meal, review), true);
  assert.equal(isCurrentRecommendation(card, { ...profile, id: 'another' }, meal, review), false);
  assert.equal(isCurrentRecommendation(card, { ...profile, allergies: ['egg'] }, meal, review), false);
  assert.equal(isCurrentRecommendation(card, profile, { ...meal, foods: [{ ...meal.foods[0], preparation: 'fried' }] }, review), false);
  assert.equal(isCurrentRecommendation(card, profile, { ...meal, foods: [{ ...meal.foods[0], ingredients: [] }] }, review), false);
});

test('failed server generation preserves requested targets for a successful explicit retry', async t => {
  const targets = [{ foodId: '2', ingredientId: null }];
  let calls = 0;
  t.mock.method(global, 'fetch', async (url, init) => {
    assert.equal(new URL(url).pathname, '/api/v1/meals/8/suggestions');
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), { targets: [{ food_id: '2', ingredient_id: null }] });
    calls++;
    if (calls === 1) return new Response('{"error_code":"GENERATION_FAILED"}', { status: 502 });
    return new Response(JSON.stringify([{
      id: '31', user_id: '1', meal_id: '8', food_id: '2', ingredient_id: null,
      food_snapshot: { name: 'Rice', ingredients: [], cooking_method: null, serving_note: null, acceptance: null },
      what_to_try: 'Try a little', why_this_may_help: 'Familiar texture', serving_tip: null,
      status: 'pending', dismiss_reasons: [], saved_at: null, created_at: '2026-10-21T00:00:00Z',
    }]));
  });
  await assert.rejects(generateMealSuggestions('1', '8', targets), /GENERATION_FAILED/);
  assert.deepEqual(targets, [{ foodId: '2', ingredientId: null }]);
  const items = await generateMealSuggestions('1', '8', targets);
  assert.deepEqual(items.map(item => item.id), ['31']);
  assert.equal(calls, 2);
});

test('legacy forms ignore retired traits while preserving serving and difficulty checks', () => {
  const { profile, meal, review } = fixtures('retired-traits-recommendation');
  const card = savedFor(profile, meal, review);
  const oldKey = JSON.stringify({ ...JSON.parse(foodFormKey(meal.foods[0])), traits: { texture: ['soft'] } });
  const suggestion = { ...card, recommendation: { ...card.recommendation, foodFormKey: oldKey } };
  const oldReview = { ...review, foodFormKeys: { [meal.foods[0].id]: oldKey } };
  assert.equal(isCurrentRecommendation(suggestion, profile, meal, oldReview), true);
  assert.equal(isCurrentRecommendation(suggestion, profile, { ...meal, foods: [{ ...meal.foods[0], preparation: 'fried' }] }, oldReview), false);
  assert.equal(isCurrentRecommendation(suggestion, profile, meal, { ...oldReview, difficulties: {} }), false);
});
