// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
const { newDraft, mealFromDraft } = require('../../src/features/meal-checkin/rules.ts');
const { newFood } = require('../../src/rules/foodDraft.ts');
const { newReviewDraft, setOutcome, reviewFromDraft } = require('../../src/features/after-meal-review/rules.ts');
const { recommendationText } = require('../../src/rules/recommendationPresentation.ts');

function fixtures(childId = 'child-d') {
  const profile = {
    id: childId, caregiverName: 'Parent', caregiverEmail: 'parent@example.com', childName: 'Child', ageRange: 'toddler',
    consent: { accountPrivacy: true, photoAnalysis: true, aiTraining: false },
    allergies: ['none'], restrictions: ['none'], familyFoods: [], approaches: ['none'], texture: [], smell: '',
    taste: [], presentation: ['separate'], temperature: '', familiarity: '', safeFoods: [], noSafeFoods: true,
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

module.exports = { fixtures, saved };
