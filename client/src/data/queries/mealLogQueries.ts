// AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteMeal, getMealCalendar, getMealDetail, listMeals } from '../api/mealLogApi';
import { deleteAfterMealReview } from '../storage/afterMealReviewStorage';
import { deleteLocalMeal } from '../storage/mealStorage';
import { homeKeys } from './homeQueries';
import { mealKeys } from './mealQueries';

export const mealLogKeys = {
  all: (childId: string) => ['meal-log', childId] as const,
  list: (childId: string, date: string | null) => ['meal-log', childId, 'list', date] as const,
  calendar: (childId: string, month: string) => ['meal-log', childId, 'calendar', month] as const,
  detail: (childId: string, mealId: string) => ['meal-log', childId, 'detail', mealId] as const,
};

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
