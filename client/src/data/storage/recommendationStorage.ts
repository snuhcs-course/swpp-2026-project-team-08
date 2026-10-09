// This Code is generated with AI

import { isCurrentRecommendation } from '../../rules/recommendationSafety';
import type { SavedSuggestion } from '../../types/home';
import { readAfterMealReview } from './afterMealReviewStorage';
import { updateHomeRecords } from './homeStorage';
import { readMeal } from './mealStorage';
import { readProfile } from './profileStorage';

export function saveRecommendation(suggestion: SavedSuggestion): Promise<SavedSuggestion> {
  const evidence = suggestion.recommendation;
  if (!evidence || !suggestion.isSaved || !suggestion.id || !suggestion.childId
    || !suggestion.title.trim() || !suggestion.description.trim() || !suggestion.servingTip?.trim()) {
    return Promise.reject(new Error('Invalid recommendation'));
  }
  return updateHomeRecords(suggestion.childId, async (records) => {
    const [profile, meal, review] = await Promise.all([
      readProfile(),
      readMeal(suggestion.childId, evidence.mealId),
      readAfterMealReview(suggestion.childId, evidence.mealId),
    ]);
    if (!profile || !meal || !review || suggestion.safetyVerifiedForProfileAt !== profile.updatedAt
      || !isCurrentRecommendation(suggestion, profile, meal, review)) {
      throw new Error('Recommendation needs fresh safety verification');
    }
    const existing = records.suggestions.find((item) => item.id === suggestion.id);
    if (existing) return existing;
    records.suggestions.push(suggestion);
    return suggestion;
  });
}
