// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { fixtures, saved } = require('../fixtures/personalized-recommendation.cjs');

const { buildRecommendations } = require('../../src/features/personalized-recommendation/rules.ts');

const { recommendationText } = require('../../src/rules/recommendationPresentation.ts');

test('recommendations use only confirmed outcomes and known forms under explicit no-restriction answers', () => {
  const { profile, meal, review } = fixtures();
  assert.equal(buildRecommendations(profile, meal, review).status, 'ready');
  assert.equal(buildRecommendations({ ...profile, allergies: [] }, meal, review).status, 'safety-unverified');
  assert.equal(buildRecommendations({ ...profile, restrictions: ['dairy'] }, meal, review).status, 'safety-unverified');
  assert.equal(buildRecommendations(profile, { ...meal, foods: [{ ...meal.foods[0], ingredients: [] }] }, review).status, 'no-safe-candidate');
  assert.equal(buildRecommendations(profile, meal, { ...review, foodFormKeys: {} }).status, 'meal-changed');
  const unconfirmed = { ...review, outcomes: [{ ...review.outcomes[0], decision: { confirmed: null, suggested: 'tasted' } }] };
  assert.equal(buildRecommendations(profile, meal, unconfirmed).status, 'insufficient-evidence');
  const candidate = buildRecommendations(profile, meal, review).candidates[0];
  assert.match(recommendationText(candidate, 'en', profile).description, /presentation difficulty/);
  assert.match(recommendationText(candidate, 'ko', profile).title, /Rice/);
});

test('legacy recommendation forms ignore retired food traits and retain serving and rejection checks', () => {
  const { foodFormKey, isCurrentRecommendation } = require('../../src/rules/recommendationSafety.ts');
  const { profile, meal, review } = fixtures('retired-traits-recommendation');
  const card = saved(buildRecommendations(profile, meal, review).candidates[0], profile);
  assert.ok(card);
  const oldKey = JSON.stringify({ ...JSON.parse(foodFormKey(meal.foods[0])), traits: { texture: ['soft'] } });
  const suggestion = { ...card, recommendation: { ...card.recommendation, foodFormKey: oldKey } };
  const oldReview = { ...review, foodFormKeys: { [meal.foods[0].id]: oldKey } };
  assert.equal(isCurrentRecommendation(suggestion, profile, meal, oldReview), true);
  assert.equal(buildRecommendations(profile, meal, oldReview).status, 'ready');
  assert.equal(isCurrentRecommendation(suggestion, profile, { ...meal, foods: [{ ...meal.foods[0], preparation: 'fried' }] }, oldReview), false);
  assert.equal(isCurrentRecommendation(suggestion, profile, meal, { ...oldReview, difficulties: {} }), false);
});
