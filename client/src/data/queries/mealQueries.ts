// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; removed photo analysis flow
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { upsertMeal } from '../api/mealLogApi';
import { readMeal, readMealDraft, readMeals, saveMeal, updateMealFoods } from '../storage/mealStorage';
import type { FoodItem } from '../../types/meal';
import { homeKeys } from './homeQueries';
import { mealKeys, mealLogKeys } from './mealQueryKeys';

export { mealKeys } from './mealQueryKeys';

export const useMealDraft = (childId: string) =>
  useQuery({
    queryKey: mealKeys.draft(childId),
    queryFn: () => readMealDraft(childId),
    enabled: !!childId,
  });
export const useMeal = (childId: string, id: string) =>
  useQuery({
    queryKey: mealKeys.detail(childId, id),
    queryFn: () => readMeal(childId, id),
    enabled: !!childId && !!id,
  });
export const useMeals = (childId: string) =>
  useQuery({
    queryKey: ['meals', childId],
    queryFn: () => readMeals(childId),
    enabled: !!childId,
  });
export function useUpdateMealFoods() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ childId, mealId, foods }: { childId: string; mealId: string; foods: FoodItem[] }) => {
      const meal = await updateMealFoods(childId, mealId, foods);
      await upsertMeal(meal);
      return meal;
    },
    onSuccess: (meal) => {
      client.setQueryData(mealKeys.detail(meal.childId, meal.id), meal);
      void client.invalidateQueries({ queryKey: ['meals', meal.childId] });
      void client.invalidateQueries({ queryKey: mealKeys.draft(meal.childId) });
      void client.invalidateQueries({ queryKey: mealLogKeys.all(meal.childId) });
    },
  });
}
export function useSaveMeal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (meal: Parameters<typeof saveMeal>[0]) => {
      const saved = await saveMeal(meal);
      await upsertMeal(saved);
      return saved;
    },
    retry: false,
    onSuccess: (meal) => {
      client.setQueryData(mealKeys.detail(meal.childId, meal.id), meal);
      void client.invalidateQueries({ queryKey: ['meals', meal.childId] });
      void client.invalidateQueries({
        queryKey: homeKeys.byChild(meal.childId),
      });
      void client.invalidateQueries({ queryKey: mealKeys.draft(meal.childId) });
      void client.invalidateQueries({ queryKey: mealLogKeys.all(meal.childId) });
    },
  });
}
