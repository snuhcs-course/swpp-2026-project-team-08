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
      ingredientId: link.ingredientId,
      title: link.suggestion.whatToTry,
      description: link.suggestion.whyThisMayHelp,
      servingTip: link.suggestion.servingTip ?? undefined,
    })),
  };
}
