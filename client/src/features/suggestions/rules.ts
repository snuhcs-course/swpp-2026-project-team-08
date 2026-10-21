// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

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
    for (const ingredient of food.ingredients) {
      if (!meal.review.ingredientResults.some((result) =>
        result.foodId === food.id && result.ingredientId === ingredient.id)) continue;
      options.push({ target: { foodId: food.id, ingredientId: ingredient.id },
        name: ingredient.name, detail: food.name });
    }
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
export const actionId = () =>
  `suggestion-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
