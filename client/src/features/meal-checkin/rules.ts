import { localDate, validDate } from '../../util/date';
export { localDate, validDate } from '../../util/date';
import { type FoodItem, type FoodTraits, type Meal, type TraitGroup } from '../../types/meal';
import { type MealDraft } from './types';
export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const emptyTraits = (): FoodTraits => ({ texture: [], tasteType: [], tasteIntensity: [], smell: [], shape: [], visibility: [], temperature: [], color: [] });
export const newFood = (): FoodItem => ({ id: newId(), name: '', ingredients: [], preparation: '', servingNote: '', traits: emptyTraits(), history: null, source: 'parent' });
export const newDraft = (childId: string): MealDraft => ({ id: newId(), childId, mealDate: localDate(), mealType: null, setting: null, photo: null, foods: [], exposureFoodId: null, step: 'details', editingFood: null, savedMealId: null });
export function toggleTrait(traits: FoodTraits, group: TraitGroup, value: string): FoodTraits {
  const multi = group === 'texture' || group === 'tasteType' || group === 'color';
  return { ...traits, [group]: traits[group].includes(value) ? (multi ? traits[group].filter((v) => v !== value) : []) : multi ? [...traits[group], value] : [value] };
}
export const confirmFoods = (foods: FoodItem[]): FoodItem[] => foods.map((food) => ({ ...food, name: food.name.trim(), source: 'parent' }));
export function mealFromDraft(draft: MealDraft): Meal {
  if (!validDate(draft.mealDate) || !draft.mealType || !draft.setting || !draft.foods.length
    || draft.foods.some((food) => !food.name.trim() || food.source !== 'parent')
    || (draft.exposureFoodId && !draft.foods.some((food) => food.id === draft.exposureFoodId))) throw new Error('Invalid meal');
  return { id: draft.id, childId: draft.childId, mealDate: draft.mealDate, mealType: draft.mealType,
    setting: draft.setting, photo: draft.photo, foods: draft.foods, exposureFoodId: draft.exposureFoodId, savedAt: new Date().toISOString() };
}
