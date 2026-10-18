// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
import { localDate, validDate } from '../../util/date';
import {
  type FoodItem,
  type Meal,
  type MealDraft,
} from '../../types/meal';
export const newId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const newDraft = (childId: string): MealDraft => ({
  id: newId(),
  childId,
  mealDate: localDate(),
  mealType: null,
  setting: null,
  photo: null,
  foods: [],
  step: 'details',
  editingFood: null,
  savedMealId: null,
});
export const confirmFoods = (foods: FoodItem[]): FoodItem[] =>
  foods.map((food) => ({ ...food, name: food.name.trim(), origin: food.origin ?? food.source, confirmed: true, source: 'parent' }));
export function mealFromDraft(draft: MealDraft): Meal {
  if (
    !validDate(draft.mealDate) ||
    !draft.mealType ||
    !draft.setting ||
    !draft.foods.length ||
    draft.foods.some((food) => !food.name.trim() || food.source !== 'parent')
  )
    throw new Error('Invalid meal');
  return {
    id: draft.id,
    childId: draft.childId,
    mealDate: draft.mealDate,
    mealType: draft.mealType,
    setting: draft.setting,
    photo: draft.photo,
    foods: draft.foods,
    suggestionLinks: draft.suggestionLinks ?? [],
    savedAt: new Date().toISOString(),
  };
}
