// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Offer only reviewed food items as suggestion targets

import type { MealDetail } from '../../types/mealRecord';
import type { Suggestion as RecordSuggestion, SuggestionTarget } from '../../types/suggestionRecord';

export function reviewedSuggestionTargets(meal: MealDetail | null): {
  target: SuggestionTarget; name: string; detail: string;
}[] {
  if (!meal?.review) return [];
  const options: { target: SuggestionTarget; name: string; detail: string }[] = [];
  for (const food of meal.foods) {
    if (!meal.review.foodResults.some((result) => result.foodId === food.id)) continue;
    options.push({ target: { foodId: food.id, ingredientId: null }, name: food.name, detail: '' });
  }
  return options;
}

export function unGeneratedTargets(
  options: ReturnType<typeof reviewedSuggestionTargets>, items: RecordSuggestion[],
) {
  return options.filter((option) => !items.some((item) =>
    item.foodId === option.target.foodId && item.ingredientId === option.target.ingredientId));
}

export function suggestionPreview(text: string) {
  return text.match(/^.*?[.!?](?:\s|$)/s)?.[0].trim() ?? text;
}
