// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버 발급 id 기준으로 저장 요청·응답 변환 재작성

import type { Meal as CheckinMeal } from '../../types/meal';
import type { CookingMethod } from '../../types/recordValues';
import { toMealDetail, toMealWrite } from '../dto/mealDto';
import { apiRequest } from '../network/apiClient';

const cookingMethods: Record<string, CookingMethod> = {
  raw: 'raw', boiled: 'boiled', steamed: 'steamed', pan_fried: 'pan_fried',
  stir_fried: 'stir_fried', baked_roasted: 'baked_roasted', mashed_blended: 'mashed_blended', other: 'other',
  Steamed: 'steamed', Boiled: 'boiled', 'Pan-fried': 'pan_fried', Baked: 'baked_roasted',
  Roasted: 'baked_roasted', Grilled: 'other', Raw: 'raw', Other: 'other',
  '찜': 'steamed', '삶기': 'boiled', '팬에 굽기': 'pan_fried', '오븐에 굽기': 'baked_roasted',
  '로스팅': 'baked_roasted', '직화 구이': 'other', '생식': 'raw', '기타': 'other',
};

export function prepareMealWrite(meal: CheckinMeal) {
  if (new Set(meal.foods.map((food) => food.id)).size !== meal.foods.length) {
    throw new Error('Duplicate meal food ID');
  }
  // 음식·재료 id 는 서버가 발급하므로 보내지 않는다. 앱 안의 임시 id 는 추천 연결을 묶는 데만 쓴다.
  const body = toMealWrite({
    mealDate: meal.mealDate,
    mealType: meal.mealType,
    setting: meal.setting,
    beforePhotoUri: meal.photo?.uri ?? null,
    foods: meal.foods.map((food) => ({
      id: food.id,
      name: food.name,
      ingredients: food.ingredients.map((name) => ({ id: null, name })),
      cookingMethod: cookingMethodFor(food.preparation),
      servingNote: food.servingNote || null,
      acceptance: food.acceptance ?? null,
    })),
    suggestionLinks: (meal.suggestionLinks ?? []).map((link) => ({
      suggestionId: link.suggestionId,
      foodId: link.foodId,
    })),
  });
  return { body };
}

export function cookingMethodFor(value: string): CookingMethod | null {
  if (!value) return null;
  const method = cookingMethods[value];
  if (!method) throw new Error('Unknown cooking method');
  return method;
}

export async function writeMeal(meal: CheckinMeal): Promise<CheckinMeal> {
  const { body } = prepareMealWrite(meal);
  const saved = toMealDetail(await apiRequest<unknown>('/api/v1/meals', {
    method: 'PUT',
    body: JSON.stringify(body),
  }));
  if (saved.userId !== meal.childId || saved.mealDate !== meal.mealDate
    || saved.mealType !== meal.mealType || saved.setting !== meal.setting
    || saved.foods.length !== meal.foods.length) {
    throw new Error('Mismatched meal response');
  }
  // 응답의 음식은 요청 순서대로 서버 id 를 받는다.
  const foodIds = new Map(meal.foods.map((food, index) => [food.id, saved.foods[index].id]));
  return {
    ...meal,
    id: saved.id,
    savedAt: saved.savedAt,
    foods: meal.foods.map((food) => ({ ...food, id: foodIds.get(food.id)! })),
    suggestionLinks: meal.suggestionLinks?.map((link) => ({
      ...link,
      foodId: foodIds.get(link.foodId)!,
    })),
  };
}
