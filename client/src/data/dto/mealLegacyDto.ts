// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천 연결로 재료 연결 제거

import type { Meal as LegacyMeal } from '../../types/meal';
import type { MealDetail } from '../../types/mealRecord';

export function toLegacyMeal(detail: MealDetail): LegacyMeal {
  return {
    id: detail.id,
    childId: detail.userId,
    mealDate: detail.mealDate,
    mealType: detail.mealType,
    setting: detail.setting,
    photo: detail.beforePhotoUri
      ? { id: detail.beforePhotoUri, uri: detail.beforePhotoUri, mimeType: 'image/jpeg' }
      : null,
    savedAt: detail.savedAt,
    foods: detail.foods.map((food) => ({
      id: food.id,
      name: food.name,
      ingredients: food.ingredients.map((ingredient) => ingredient.name),
      preparation: food.cookingMethod ?? '',
      servingNote: food.servingNote ?? '',
      source: 'parent',
      confirmed: true,
      acceptance: food.acceptance,
    })),
    suggestionLinks: detail.suggestionLinks.map((link) => ({
      suggestionId: link.suggestionId,
      foodId: link.foodId,
      title: link.suggestion.whatToTry,
      description: link.suggestion.whyThisMayHelp,
      servingTip: link.suggestion.servingTip ?? undefined,
    })),
  };
}
