// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteMeal, getMealCalendar, getMealDetail, listMeals } from '../api/mealLogApi';
import { deleteAfterMealReview } from '../storage/afterMealReviewStorage';
import { deleteLocalMeal } from '../storage/mealStorage';
import { homeKeys } from './homeQueries';
import { mealKeys, mealLogKeys } from './mealQueryKeys';


export { mealLogKeys } from './mealQueryKeys';


export function useMealList(childId: string, date: string | null) {
  return useQuery({
    queryKey: mealLogKeys.list(childId, date),
    queryFn: () => listMeals(childId, date),
    enabled: !!childId,
    placeholderData: (previous) => previous,
  });
}

export function useMealCalendar(childId: string, month: string) {
  return useQuery({
    queryKey: mealLogKeys.calendar(childId, month),
    queryFn: () => getMealCalendar(childId, month),
    enabled: !!childId && !!month,
    placeholderData: (previous) => previous,
  });
}

export function useMealDetail(childId: string, mealId: string) {
  return useQuery({
    queryKey: mealLogKeys.detail(childId, mealId),
    queryFn: () => getMealDetail(childId, mealId),
    enabled: !!childId && !!mealId,
    placeholderData: (previous) => previous,
  });
}

export function useDeleteMeal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ childId, mealId }: { childId: string; mealId: string }) => {
      await deleteMeal(childId, mealId);
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
