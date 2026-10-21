// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listMealDetails, getMealDetail } from '../api/mealReadApi';
import { deleteMealRecord } from '../api/mealHistoryApi';
import { deleteAfterMealReview } from '../storage/afterMealReviewStorage';
import { deleteLocalMeal } from '../storage/mealStorage';
import { homeKeys } from './homeQueries';
import { mealKeys, mealLogKeys } from './mealQueryKeys';


export { mealLogKeys } from './mealQueryKeys';


export function useMealList(childId: string, date: string | null) {
  return useQuery({
    queryKey: mealLogKeys.list(childId, date),
    queryFn: async ({ signal }) => {
      const meals = await listMealDetails(signal);
      if (meals.some((meal) => meal.userId !== childId)) throw new Error('Mismatched meal owner');
      return meals;
    },
    enabled: !!childId,
  });
}

export function useMealCalendar(childId: string, month: string) {
  return useQuery({
    queryKey: mealLogKeys.calendar(childId, month),
    queryFn: async ({ signal }) => {
      const meals = await listMealDetails(signal);
      if (meals.some((meal) => meal.userId !== childId)) throw new Error('Mismatched meal owner');
      const counts = new Map<string, number>();
      for (const meal of meals) {
        if (meal.mealDate.startsWith(`${month}-`)) counts.set(meal.mealDate, (counts.get(meal.mealDate) ?? 0) + 1);
      }
      return [...counts].map(([date, count]) => ({ date, count }));
    },
    enabled: !!childId && !!month,
  });
}

export function useMealDetail(childId: string, mealId: string) {
  return useQuery({
    queryKey: mealLogKeys.detail(childId, mealId),
    queryFn: async ({ signal }) => {
      const meal = await getMealDetail(mealId, signal);
      if (meal.userId !== childId) throw new Error('Mismatched meal owner');
      return meal;
    },
    enabled: !!childId && !!mealId,
  });
}

export function useDeleteMeal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ childId, mealId }: { childId: string; mealId: string }) => {
      await deleteMealRecord(mealId);
      await deleteLocalMeal(childId, mealId);
      await deleteAfterMealReview(childId, mealId);
    },
    retry: false,
    onSuccess: (_result, { childId, mealId }) => {
      client.removeQueries({ queryKey: mealLogKeys.detail(childId, mealId) });
      client.removeQueries({ queryKey: mealKeys.detail(childId, mealId) });
      void client.invalidateQueries({ queryKey: mealLogKeys.all(childId) });
      void client.invalidateQueries({ queryKey: ['meals', childId] });
      void client.invalidateQueries({ queryKey: homeKeys.byChild(childId) });
    },
  });
}
