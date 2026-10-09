const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');

require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText,
  filename,
);

const values = new Map();
let failedKey = null;
const storage = {
  async getItem(key) { return values.get(key) ?? null; },
  async setItem(key, value) {
    if (key === failedKey) { failedKey = null; throw new Error('Disk full'); }
    values.set(key, value);
  },
  async removeItem(key) { values.delete(key); },
};
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  return name === '@react-native-async-storage/async-storage' ? storage : originalLoad.call(this, name, ...args);
};

const { newDraft, mealFromDraft } = require('../src/features/meal-checkin/rules.ts');
const { newFood } = require('../src/rules/foodDraft.ts');
const { newReviewDraft, setOutcome, reviewFromDraft } = require('../src/features/after-meal-review/rules.ts');
const { buildRecommendations } = require('../src/features/personalized-recommendation/rules.ts');
const { savedSuggestionsForProfile } = require('../src/rules/savedSuggestions.ts');
const { recommendationText } = require('../src/rules/recommendationPresentation.ts');
const { saveMeal, readMeal, updateMealFoods } = require('../src/data/storage/mealStorage.ts');
const { saveAfterMealReview } = require('../src/data/storage/afterMealReviewStorage.ts');
const { saveProfile } = require('../src/data/storage/profileStorage.ts');
const { saveRecommendation } = require('../src/data/storage/recommendationStorage.ts');
const { readHomeRecords } = require('../src/data/storage/homeStorage.ts');

function fixtures(childId = 'child-d') {
  const profile = {
    id: childId, caregiverName: 'Parent', caregiverEmail: 'parent@example.com', childName: 'Child', ageRange: 'toddler',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], familyFoods: [], approaches: ['none'], texture: [], smell: '',
    taste: [], presentation: ['separate'], temperature: '', familiarity: '', safeFoods: [], noSafeFoods: true,
    updatedAt: '2026-10-08T00:00:00.000Z',
  };
  const draft = newDraft(childId);
  draft.mealType = 'lunch'; draft.setting = 'home'; draft.step = 'goal';
  draft.foods = [{ ...newFood(), id: 'food-d', name: 'Rice', ingredients: ['Rice'], preparation: 'boiled', servingNote: 'mixed on plate' }];
  const meal = mealFromDraft(draft);
  const reviewDraft = newReviewDraft(meal);
  reviewDraft.afterPhoto = { id: 'after', uri: 'file:///after.png', mimeType: 'image/png' };
  reviewDraft.outcomes = setOutcome(reviewDraft.outcomes, 'food-d', 'tasted');
  reviewDraft.outcomes = setOutcome(reviewDraft.outcomes, 'food-d', 'tasted', reviewDraft.outcomes[0].ingredients[0].id);
  reviewDraft.difficulties = { 'food-d': [{ id: 'shape:varied', category: 'shape', value: 'varied' }] };
  return { profile, meal, review: reviewFromDraft(reviewDraft, meal) };
}

function saved(candidate, profile) {
  const english = recommendationText(candidate, 'en', profile);
  return {
    id: candidate.id, childId: candidate.childId, ingredients: candidate.ingredients,
    title: english.title, description: english.description, servingTip: english.servingTip,
    isSaved: true, safetyVerifiedForProfileAt: profile.updatedAt,
    recommendation: {
      mealId: candidate.mealId, foodId: candidate.foodId, foodName: candidate.foodName,
      foodFormKey: candidate.foodFormKey, reviewSavedAt: candidate.reviewSavedAt,
      outcome: candidate.outcome, difficulty: candidate.difficulty, kind: candidate.kind,
    },
  };
}

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
  failedKey = `nurturebites.home.${profile.id}.v1`;
  await assert.rejects(saveRecommendation(suggestion));
  assert.equal((await readHomeRecords(profile.id)).suggestions.length, 0);
  await saveRecommendation(suggestion);
  assert.equal((await readHomeRecords(profile.id)).suggestions.length, 1);
});
