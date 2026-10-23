// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../helpers/register.cjs');
const { fixtures, saved } = require('../fixtures/personalized-recommendation.cjs');

const { createMemoryStorage } = require('../helpers/memory-storage.cjs');
const { values, storage, failNextWrite } = createMemoryStorage();

const { mockModules } = require('../helpers/mock-modules.cjs');
mockModules((name) => {
  return name === '@react-native-async-storage/async-storage' ? storage : undefined;
});

const { buildRecommendations } = require('../../src/features/personalized-recommendation/rules.ts');

const { savedSuggestionsForProfile } = require('../../src/rules/savedSuggestions.ts');

const { saveMeal, readMeal, updateMealFoods } = require('../../src/data/storage/mealStorage.ts');

const { saveAfterMealReview } = require('../../src/data/storage/afterMealReviewStorage.ts');

const { saveProfile } = require('../../src/data/storage/profileStorage.ts');

const { saveRecommendation } = require('../../src/data/storage/recommendationStorage.ts');

const { readHomeRecords } = require('../../src/data/storage/homeStorage.ts');

test('saved recommendations are idempotent and disappear from actionable views when safety or form changes', async () => {
  values.clear();
  const { profile, meal, review } = fixtures();
  await saveProfile(profile);
  await saveMeal(meal);
  await saveAfterMealReview(review);
  const candidate = buildRecommendations(profile, meal, review).candidates[0];
  const suggestion = saved(candidate, profile);
  await saveRecommendation(suggestion);
  await saveRecommendation(suggestion);
  let home = await readHomeRecords(profile.id);
  assert.equal(home.suggestions.length, 1);
  assert.equal(savedSuggestionsForProfile(home, profile, [meal]).length, 1);
  const changedProfile = { ...profile, allergies: ['egg'], updatedAt: 'later' };
  assert.equal(savedSuggestionsForProfile(home, changedProfile, [meal]).length, 0);
  await saveProfile(changedProfile);
  await assert.rejects(saveRecommendation(saved({ ...candidate, id: 'another' }, profile)));
  await saveProfile(profile);
  await updateMealFoods(profile.id, meal.id, [{ ...meal.foods[0], preparation: 'fried' }]);
  const edited = await readMeal(profile.id, meal.id);
  home = await readHomeRecords(profile.id);
  assert.equal(home.suggestions.length, 1);
  assert.equal(savedSuggestionsForProfile(home, profile, [edited]).length, 0);
  await assert.rejects(saveRecommendation(saved({ ...candidate, id: 'another' }, profile)));
});

test('failed recommendation write keeps the card available for an idempotent retry', async () => {
  values.clear();
  const { profile, meal, review } = fixtures('retry-d');
  await saveProfile(profile);
  await saveMeal(meal);
  await saveAfterMealReview(review);
  const suggestion = saved(buildRecommendations(profile, meal, review).candidates[0], profile);
  failNextWrite(`nurturebites.home.${profile.id}.v1`);
  await assert.rejects(saveRecommendation(suggestion));
  assert.equal((await readHomeRecords(profile.id)).suggestions.length, 0);
  await saveRecommendation(suggestion);
  assert.equal((await readHomeRecords(profile.id)).suggestions.length, 1);
});
