// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 입력 없는 첫 단계 식사 초안 저장 및 복원 방지
// AI-generated with GPT-6, 2026-11-13, reviewed by Haechan Jung
// Changed: 편집 중인 음식의 추천 연결 검증

import {
  mealSettings,
  mealTypes,
  mealSteps,
  type FoodItem,
  type MealDraft,
  type Meal,
  type MealSuggestionLink,
} from '../../types/meal';
import { validDate } from '../../util/date';
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const list = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');
function isSuggestionLink(v: unknown): v is MealSuggestionLink {
  return record(v) && typeof v.suggestionId === 'string' && typeof v.foodId === 'string' &&
    (v.ingredientId === undefined || v.ingredientId === null || typeof v.ingredientId === 'string') &&
    typeof v.title === 'string' && typeof v.description === 'string' &&
    (v.servingTip === undefined || typeof v.servingTip === 'string');
}
export function isFood(v: unknown): v is FoodItem {
  if (
    !record(v) ||
    typeof v.id !== 'string' ||
    typeof v.name !== 'string' ||
    !list(v.ingredients) ||
    typeof v.preparation !== 'string' ||
    typeof v.servingNote !== 'string' ||
    typeof v.confirmed !== 'boolean' ||
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
    (v.initialMealDate === undefined || validDate(v.initialMealDate)) &&
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
    (v.editingSuggestionLink === undefined || v.editingSuggestionLink === null ||
      (isSuggestionLink(v.editingSuggestionLink) && isFood(v.editingFood) &&
        v.editingSuggestionLink.foodId === v.editingFood.id)) &&
    (v.suggestionLinks === undefined || (Array.isArray(v.suggestionLinks) && v.suggestionLinks.every((link) => isSuggestionLink(link) && v.foods instanceof Array && v.foods.some((food: FoodItem) => food.id === link.foodId)) && new Set(v.suggestionLinks.map((link) => link.suggestionId)).size === v.suggestionLinks.length)) &&
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
      (food) => isFood(food) && food.confirmed === true && !!food.name.trim(),
    )
  );
}
