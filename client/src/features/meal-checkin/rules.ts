// AI-generated with GPT-6, 2026-10-26, reviewed by Seoyeon Heo
import { localDate, validDate } from '../../util/date';
import {
  type FoodItem,
  type Meal,
  type MealDraft,
} from '../../types/meal';
import type { IngredientCatalogStatus, IngredientInputStatus } from './types';
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
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
export const confirmFoods = (foods: FoodItem[]): FoodItem[] =>
  foods.map((food) => ({ ...food, name: food.name.trim(), confirmed: true }));
export function mealFromDraft(draft: MealDraft): Meal {
  if (
    !validDate(draft.mealDate) ||
    !draft.mealType ||
    !draft.setting ||
    !draft.foods.length ||
    draft.foods.some((food) => !food.name.trim() || food.confirmed !== true)
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

// AI-generated with GPT-6, 2026-10-26, reviewed by Seoyeon Heo
export function getIngredientInput(
  input: string,
  selected: string[],
  catalog: string[],
  catalogStatus: IngredientCatalogStatus,
) {
  const normalize = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();
  const query = normalize(input);
  const existing = new Set(selected.map(normalize));
  const match = catalogStatus === 'ready' && query
    ? catalog.find((name) => normalize(name) === query)
    : undefined;
  const choices = catalogStatus === 'ready' && query
    ? catalog.filter((name) => normalize(name).includes(query) && !existing.has(normalize(name))).slice(0, 6)
    : [];
  let status: IngredientInputStatus = catalogStatus;
  if (catalogStatus === 'ready') {
    if (!query) status = 'empty';
    else if (existing.has(query)) status = 'duplicate';
    else if (match) status = 'ready';
    else status = choices.length ? 'choose' : 'no-match';
  }
  return { status, choices, match, canAdd: status === 'ready' };
}
