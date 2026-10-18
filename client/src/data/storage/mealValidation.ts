// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
import {
  mealSettings,
  mealTypes,
  mealSteps,
  type FoodItem,
  type MealDraft,
  type Meal,
} from '../../types/meal';
import { validDate } from '../../util/date';
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const list = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');
export function isFood(v: unknown): v is FoodItem {
  if (
    !record(v) ||
    typeof v.id !== 'string' ||
    typeof v.name !== 'string' ||
    !list(v.ingredients) ||
    typeof v.preparation !== 'string' ||
    typeof v.servingNote !== 'string' ||
    !(v.confirmed === undefined || typeof v.confirmed === 'boolean') ||
    !(v.origin === undefined || v.origin === 'ai' || v.origin === 'parent') ||
    !(v.acceptance === undefined || v.acceptance === null || (typeof v.acceptance === 'number' && Number.isInteger(v.acceptance) && v.acceptance >= 0 && v.acceptance <= 3)) ||
    (v.source !== 'ai' && v.source !== 'parent')
  )
    return false;
  return true;
}
export function isDraft(v: unknown, childId: string): v is MealDraft {
  return (
    record(v) &&
    typeof v.id === 'string' &&
    v.childId === childId &&
    validDate(v.mealDate) &&
    (v.mealType === null || mealTypes.includes(v.mealType as never)) &&
    (v.setting === null || mealSettings.includes(v.setting as never)) &&
    mealSteps.includes(v.step as never) &&
    (v.photo === null ||
      (record(v.photo) &&
        typeof v.photo.id === 'string' &&
        typeof v.photo.uri === 'string' &&
        typeof v.photo.mimeType === 'string')) &&
    Array.isArray(v.foods) &&
    v.foods.every(isFood) &&
    new Set(v.foods.map((food) => food.id)).size === v.foods.length &&
    (v.editingFood === null || isFood(v.editingFood)) &&
    (v.suggestionLinks === undefined || (Array.isArray(v.suggestionLinks) && v.suggestionLinks.every((link) => record(link) && typeof link.suggestionId === 'string' && typeof link.foodId === 'string' && typeof link.title === 'string' && typeof link.description === 'string' && (link.servingTip === undefined || typeof link.servingTip === 'string') && v.foods instanceof Array && v.foods.some((food: FoodItem) => food.id === link.foodId)) && new Set(v.suggestionLinks.map((link) => link.suggestionId)).size === v.suggestionLinks.length)) &&
    (v.savedMealId === null || v.savedMealId === v.id)
  );
}

export function isMeal(v: unknown, childId: string): v is Meal {
  return (
    record(v) &&
    typeof v.savedAt === 'string' &&
    isDraft(
      { ...v, step: 'complete', editingFood: null, savedMealId: v.id },
      childId,
    ) &&
    !!v.mealType &&
    !!v.setting &&
    Array.isArray(v.foods) &&
    v.foods.length > 0 &&
    v.foods.every(
      (food) => isFood(food) && food.source === 'parent' && !!food.name.trim(),
    )
  );
}
