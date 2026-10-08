import type { HomeRecords } from '../types/home';
import type { ChildProfile } from '../types/profile';
import type { Meal } from '../types/meal';
import { isCurrentRecommendation } from './recommendationSafety';

export function savedSuggestionsForProfile(records: HomeRecords, profile: ChildProfile, meals: Meal[] = []) {
  // Older cards without a source food form cannot be rechecked against the current Meal.
  return records.suggestions.filter((item) => item.childId === profile.id && item.isSaved
    && !!item.recommendation
    && isCurrentRecommendation(item, profile, meals.find((meal) => meal.id === item.recommendation?.mealId)));
}
