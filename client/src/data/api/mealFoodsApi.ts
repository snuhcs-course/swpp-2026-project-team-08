import type { FoodItem as LegacyFood } from '../../types/meal';
import type { MealDetail } from '../../types/mealRecord';
import { toMealDetail } from '../dto/mealDto';
import { apiRequest } from '../network/apiClient';
import { cookingMethodFor } from './mealWriteApi';

export async function updateReviewMealFoods(
  mealId: string, foods: LegacyFood[], existingFoodIds: string[],
): Promise<{ detail: MealDetail; foodIdMap: Map<string, string> }> {
  let nextId = [...existingFoodIds, ...foods.map((food) => food.id)]
    .filter((id) => /^[1-9][0-9]*$/.test(id)).reduce((max, id) => {
    const value = BigInt(id);
    return value > max ? value : max;
  }, 0n) + 1n;
  const foodIdMap = new Map<string, string>();
  const body = {
    foods: foods.map((food) => {
      const id = /^[1-9][0-9]*$/.test(food.id) ? food.id : String(nextId++);
      foodIdMap.set(food.id, id);
      return {
        id,
        name: food.name,
        ingredients: food.ingredients.map((name) => ({ id: null, name })),
        cooking_method: cookingMethodFor(food.preparation),
        serving_note: food.servingNote || null,
        acceptance: food.acceptance ?? null,
      };
    }),
  };
  if (!body.foods.length || new Set(body.foods.map((food) => food.id)).size !== body.foods.length) {
    throw new Error('Invalid meal food IDs');
  }
  const detail = toMealDetail(await apiRequest<unknown>(
    `/api/v1/meals/${encodeURIComponent(mealId)}/foods`,
    { method: 'PUT', body: JSON.stringify(body) },
  ));
  if (detail.id !== mealId) throw new Error('Mismatched meal response');
  return { detail, foodIdMap };
}
