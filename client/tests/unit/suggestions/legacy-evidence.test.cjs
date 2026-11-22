// AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
// Changed: Validate retained recommendation evidence and current server suggestion retry
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Tests legacy evidence compatibility and current API generation; only native storage and HTTP are mocked.
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 프로필 fixture 를 채식 제한·서버 연령 값으로, 추천 생성을 음식 단위 계약으로 변경
// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 기존 추천 근거 규칙을 Unit으로 이동하고 생성 Retry 중복 제거
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../../helpers/register.cjs');
const { newDraft, mealFromDraft } = require('../../../src/features/meal-checkin/rules.ts');
const { newFood } = require('../../../src/rules/foodDraft.ts');
const { newReviewDraft, setOutcome, reviewFromDraft } = require('../../../src/features/after-meal-review/rules.ts');
const { recommendationText } = require('../../../src/rules/recommendationPresentation.ts');
const { foodFormKey, isCurrentRecommendation } = require('../../../src/rules/recommendationSafety.ts');

function fixtures(childId = 'child-d') {
  const profile = {
    id: childId, caregiverName: 'Parent', caregiverEmail: 'parent@example.com', childName: 'Child', ageRange: 'AGE_2_3',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], vegetarianRestrictions: [], safeFoods: [],
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

test('기존 추천의 제한 답변·확정 결과가 유효하면 사용 가능하며 미응답·제한 변경·미확정 결과이면 사용할 수 없다', () => {
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

test('기존 추천의 자녀·알레르기·조리법·재료가 바뀌면 추천을 사용할 수 없다', () => {
  const { profile, meal, review } = fixtures();
  const card = savedFor(profile, meal, review);
  assert.equal(isCurrentRecommendation(card, profile, meal, review), true);
  assert.equal(isCurrentRecommendation(card, { ...profile, id: 'another' }, meal, review), false);
  assert.equal(isCurrentRecommendation(card, { ...profile, allergies: ['egg'] }, meal, review), false);
  assert.equal(isCurrentRecommendation(card, profile, { ...meal, foods: [{ ...meal.foods[0], preparation: 'fried' }] }, review), false);
  assert.equal(isCurrentRecommendation(card, profile, { ...meal, foods: [{ ...meal.foods[0], ingredients: [] }] }, review), false);
});

test('이전 형식의 음식 특성은 무시하지만 조리법이 바뀌거나 어려움 사유가 없어지면 기존 추천을 사용할 수 없다', () => {
  const { profile, meal, review } = fixtures('retired-traits-recommendation');
  const card = savedFor(profile, meal, review);
  const oldKey = JSON.stringify({ ...JSON.parse(foodFormKey(meal.foods[0])), traits: { texture: ['soft'] } });
  const suggestion = { ...card, recommendation: { ...card.recommendation, foodFormKey: oldKey } };
  const oldReview = { ...review, foodFormKeys: { [meal.foods[0].id]: oldKey } };
  assert.equal(isCurrentRecommendation(suggestion, profile, meal, oldReview), true);
  assert.equal(isCurrentRecommendation(suggestion, profile, { ...meal, foods: [{ ...meal.foods[0], preparation: 'fried' }] }, oldReview), false);
  assert.equal(isCurrentRecommendation(suggestion, profile, meal, { ...oldReview, difficulties: {} }), false);
});
