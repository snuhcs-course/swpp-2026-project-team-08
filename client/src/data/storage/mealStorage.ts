import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Meal, MealDraft } from '../../types/meal';
import { isDraft, isMeal } from './mealValidation';
import { readHomeRecords } from './homeStorage';
const draftKey = (id: string) => `nurturebites.meal-draft.${id}.v1`;
const mealsKey = (id: string) => `nurturebites.meals.${id}.v1`;
// One queue per child also serializes final save against pending autosaves.
const queues = new Map<string, Promise<unknown>>();
function queued<T>(childId: string, work: () => Promise<T>): Promise<T> {
  const next = (queues.get(childId) ?? Promise.resolve()).catch(() => undefined).then(work);
  queues.set(childId, next);
  void next.finally(() => { if (queues.get(childId) === next) queues.delete(childId); }).catch(() => undefined);
  return next;
}
export async function readMealDraft(childId: string): Promise<MealDraft | null> {
  await queues.get(childId)?.catch(() => undefined);
  const raw = await AsyncStorage.getItem(draftKey(childId));
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (!isDraft(value, childId)) throw new Error('Invalid meal draft');
  // Completion can be restored, but must not appear as a new Home draft.
  return { ...value, step: value.step === 'analyzing' ? 'method' : value.step };
}
export const saveMealDraft = (draft: MealDraft) => queued(draft.childId, async () => {
  if (!isDraft(draft, draft.childId)) throw new Error('Invalid meal draft');
  await AsyncStorage.setItem(draftKey(draft.childId), JSON.stringify(draft));
});
export async function readMeals(childId: string): Promise<Meal[]> {
  const raw = await AsyncStorage.getItem(mealsKey(childId));
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value) || !value.every((meal) => isMeal(meal, childId))) throw new Error('Invalid meals');
  return value;
}
export const readMeal = async (childId: string, mealId: string) => (await readMeals(childId)).find((meal) => meal.id === mealId) ?? null;
export const saveMeal = (meal: Meal): Promise<Meal> => queued(meal.childId, async () => {
  if (!isMeal(meal, meal.childId)) throw new Error('Invalid meal');
  const meals = await readMeals(meal.childId);
  const saved = meals.find((entry) => entry.id === meal.id) ?? meal;
  if (!meals.some((entry) => entry.id === saved.id)) meals.push(saved);
  await AsyncStorage.setItem(mealsKey(meal.childId), JSON.stringify(meals));
  const home = await readHomeRecords(meal.childId);
  home.meals = [...home.meals.filter((entry) => entry.id !== saved.id), { id: saved.id, childId: saved.childId, mealDate: saved.mealDate }];
  await AsyncStorage.setItem(`nurturebites.home.${meal.childId}.v1`, JSON.stringify(home));
  // A completion receipt preserves the saved ID even if the app closes before navigation.
  await AsyncStorage.setItem(draftKey(meal.childId), JSON.stringify({ ...saved, step: 'complete', editingFood: null, savedMealId: saved.id }));
  return saved;
});
