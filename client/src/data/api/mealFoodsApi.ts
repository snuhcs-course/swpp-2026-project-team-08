// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 기존 음식은 서버 id 로 갱신하고 새 음식은 id 없이 보내도록 변경

import type { FoodItem as LegacyFood } from '../../types/meal';
import type { MealDetail } from '../../types/mealRecord';
import { toMealDetail, toMealFoodWrite } from '../dto/mealDto';
import { apiRequest } from '../network/apiClient';
import { cookingMethodFor } from './mealWriteApi';

export async function updateReviewMealFoods(
  mealId: string, foods: LegacyFood[], existingFoodIds: string[],
): Promise<{ detail: MealDetail; foodIdMap: Map<string, string> }> {
  if (!foods.length || new Set(foods.map((food) => food.id)).size !== foods.length) {
    throw new Error('Invalid meal food IDs');
  }
  // 서버가 발급한 id 를 가진 음식만 기존 음식으로 갱신한다. 나머지는 새 음식이다.
  const existing = new Set(existingFoodIds);
  const body = {
    foods: foods.map((food) => ({
      ...(existing.has(food.id) ? { id: food.id } : {}),
      ...toMealFoodWrite({
        id: food.id,
        name: food.name,
        ingredients: food.ingredients.map((name) => ({ id: null, name })),
        cookingMethod: cookingMethodFor(food.preparation),
        servingNote: food.servingNote || null,
        acceptance: food.acceptance ?? null,
      }),
    })),
  };
  const detail = toMealDetail(await apiRequest<unknown>(
    `/api/v1/meals/${encodeURIComponent(mealId)}/foods`,
    { method: 'PUT', body: JSON.stringify(body) },
  ));
  if (detail.id !== mealId || detail.foods.length !== foods.length) {
    throw new Error('Mismatched meal response');
  }
  // 새 음식은 기존 음식을 뺀 나머지 응답 음식을 요청 순서대로 받는다.
  const created = detail.foods.filter((food) => !existing.has(food.id));
  const foodIdMap = new Map<string, string>();
  let next = 0;
  for (const food of foods) {
    foodIdMap.set(food.id, existing.has(food.id) ? food.id : created[next++].id);
  }
  return { detail, foodIdMap };
}
