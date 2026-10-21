import type { Meal as CheckinMeal } from '../../types/meal';
import type { CookingMethod } from '../../types/recordValues';
import { toMealWrite, toMeal } from '../dto/mealDto';
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
  const foodIds = new Map(meal.foods.map((food, index) => [food.id, String(index + 1)]));
  if (foodIds.size !== meal.foods.length) throw new Error('Duplicate meal food ID');
  const methodFor = (value: string): CookingMethod | null => {
    if (!value) return null;
    const method = cookingMethods[value];
    if (!method) throw new Error('Unknown cooking method');
    return method;
  };
  const draft = {
    mealDate: meal.mealDate,
    mealType: meal.mealType,
    setting: meal.setting,
    beforePhotoUri: meal.photo?.uri ?? null,
    foods: meal.foods.map((food) => ({
      id: foodIds.get(food.id)!,
      name: food.name,
      ingredients: food.ingredients.map((name) => ({ id: null, name })),
      cookingMethod: methodFor(food.preparation),
      servingNote: food.servingNote || null,
      acceptance: food.acceptance ?? null,
    })),
    suggestionLinks: (meal.suggestionLinks ?? []).map((link) => ({
      suggestionId: link.suggestionId,
      foodId: foodIds.get(link.foodId) ?? '',
      ingredientId: link.ingredientId ?? null,
    })),
  };
  return { foodIds, body: toMealWrite(draft) };
}

export async function writeMeal(meal: CheckinMeal): Promise<CheckinMeal> {
  const { foodIds, body } = prepareMealWrite(meal);
  const saved = toMeal(await apiRequest<unknown>('/api/v1/meals', {
    method: 'PUT',
    body: JSON.stringify(body),
  }));
  if (saved.userId !== meal.childId || saved.mealDate !== meal.mealDate
    || saved.mealType !== meal.mealType || saved.setting !== meal.setting) {
    throw new Error('Mismatched meal response');
  }
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
