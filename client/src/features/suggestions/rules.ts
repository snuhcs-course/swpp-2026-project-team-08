// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 추천 대상을 음식 단위로만 제공

import type { MealDetail } from '../../types/mealRecord';
import type { Suggestion as RecordSuggestion, SuggestionTarget } from '../../types/suggestionRecord';

export function reviewedSuggestionTargets(meal: MealDetail | null): {
  target: SuggestionTarget; name: string; detail: string;
}[] {
  if (!meal?.review) return [];
  // 추천은 음식 단위다. 식후 리뷰에 결과가 있는 음식만 대상이 된다.
  return meal.foods
    .filter((food) => meal.review!.foodResults.some((result) => result.foodId === food.id))
    .map((food) => ({ target: { foodId: food.id }, name: food.name, detail: '' }));
}

export function unGeneratedTargets(
  options: ReturnType<typeof reviewedSuggestionTargets>, items: RecordSuggestion[],
) {
  return options.filter((option) => !items.some((item) => item.foodId === option.target.foodId));
}

export function suggestionPreview(text: string) {
  return text.match(/^.*?[.!?](?:\s|$)/s)?.[0].trim() ?? text;
}
