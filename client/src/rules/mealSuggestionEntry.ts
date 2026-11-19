// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: Eaten을 포함한 Home·식사 상세의 공통 추천 진입 조건 정의

import type { MealDetail } from '../types/mealRecord';
import type { Suggestion } from '../types/suggestionRecord';

export function getSuggestionTargetFoodIds(meal: MealDetail): Set<string> {
  return new Set(
    meal.review?.foodResults
      .filter(({ outcome }) => outcome !== null)
      .map(({ foodId }) => foodId),
  );
}

// 식사에 생성된 추천이 없거나, pending인 추천이 있으면 보여준다.
export function shouldShowSuggestionMeal(
  meal: MealDetail,
  suggestions: readonly Suggestion[],
): boolean {
  const targetFoodIds = getSuggestionTargetFoodIds(meal);
  if (targetFoodIds.size === 0) return false;

  const relevant = suggestions.filter((suggestion) =>
    suggestion.userId === meal.userId && suggestion.mealId === meal.id
      && targetFoodIds.has(suggestion.foodId));

  return relevant.length === 0 || relevant.some(({ status }) => status === 'pending');
}
