// AI-generated with GPT-6, 2026-10-22, reviewed by Haechan Jung
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FoodItem, Meal, MealDraft } from '../../types/meal';
import { isDraft, isMeal } from './mealValidation';
const draftKey = (id: string) => `nurturebites.meal-draft.${id}.v1`;
const mealsKey = (id: string) => `nurturebites.meals.${id}.v1`;
// One queue per child also serializes final save against pending autosaves.
const queues = new Map<string, Promise<unknown>>();
function queued<T>(childId: string, work: () => Promise<T>): Promise<T> {
  const next = (queues.get(childId) ?? Promise.resolve())
    .catch(() => undefined)
    .then(work);
  queues.set(childId, next);
  void next
    .finally(() => {
      if (queues.get(childId) === next) queues.delete(childId);
    })
    .catch(() => undefined);
  return next;
}
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Compatibility for records written before the feature was removed.
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
function normalizeStoredFood(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const next = { ...value } as Record<string, unknown>;
  delete next.history;
  delete next.traits;
  // AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
  // Older entries used source for confirmation and origin for provenance.
  if (next.confirmed === undefined) next.confirmed = next.source === 'parent';
  if (next.origin === 'ai' || next.origin === 'parent') next.source = next.origin;
  delete next.origin;
  return next;
}

function normalizeStoredMeal(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const next = { ...value } as Record<string, unknown>;
  delete next.exposureFoodId;
  // AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
  if (Array.isArray(next.foods)) next.foods = next.foods.map(normalizeStoredFood);
  if (next.editingFood) next.editingFood = normalizeStoredFood(next.editingFood);
  if (next.step === 'goal') next.step = 'foods';
  return next;
}

export async function readMealDraft(
  childId: string,
): Promise<MealDraft | null> {
  await queues.get(childId)?.catch(() => undefined);
  const raw = await AsyncStorage.getItem(draftKey(childId));
  if (!raw) return null;
  const value: unknown = normalizeStoredMeal(JSON.parse(raw));
  if (!isDraft(value, childId)) throw new Error('Invalid meal draft');
  // Preserve saved receipts and all user-confirmed foods. Old photo fixtures must
  // never reappear as foods the caregiver entered.
  if (value.step === 'complete') return value;
  const keepFood = (food: FoodItem) => food.source !== 'ai' || food.confirmed === true;
  const foods = value.foods.filter(keepFood);
  return {
    ...value,
    foods,
    editingFood: value.editingFood && keepFood(value.editingFood) ? value.editingFood : null,
    suggestionLinks: value.suggestionLinks?.filter((link) => foods.some((food) => food.id === link.foodId)),
    step: ['method', 'analyzing', 'analysis-error'].includes(value.step) ? 'foods' : value.step,
  };
}
export const saveMealDraft = (draft: MealDraft) =>
  queued(draft.childId, async () => {
    if (!isDraft(draft, draft.childId)) throw new Error('Invalid meal draft');
    await AsyncStorage.setItem(draftKey(draft.childId), JSON.stringify(draft));
  });
export async function readMeals(childId: string): Promise<Meal[]> {
  const raw = await AsyncStorage.getItem(mealsKey(childId));
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  const value = Array.isArray(parsed) ? parsed.map(normalizeStoredMeal) : parsed;
  if (!Array.isArray(value) || !value.every((meal) => isMeal(meal, childId)))
    throw new Error('Invalid meals');
  return value;
}
export const saveMeal = (meal: Meal): Promise<Meal> =>
  queued(meal.childId, async () => {
    if (!isMeal(meal, meal.childId)) throw new Error('Invalid meal');
    const meals = await readMeals(meal.childId);
    const saved = meals.find((entry) => entry.id === meal.id) ?? meal;
    if (!meals.some((entry) => entry.id === saved.id)) meals.push(saved);
    await AsyncStorage.setItem(mealsKey(meal.childId), JSON.stringify(meals));
    // A completion receipt preserves the saved ID even if the app closes before navigation.
    await AsyncStorage.setItem(
      draftKey(meal.childId),
      JSON.stringify({
        ...saved,
        step: 'complete',
        editingFood: null,
        savedMealId: saved.id,
      }),
    );
    return saved;
  });
export const deleteLocalMeal = (childId: string, mealId: string): Promise<void> =>
  queued(childId, async () => {
    const meals = (await readMeals(childId)).filter((meal) => meal.id !== mealId);
    await AsyncStorage.setItem(mealsKey(childId), JSON.stringify(meals));
  });
