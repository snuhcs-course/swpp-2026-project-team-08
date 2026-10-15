// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { compareMealPhotos } from '../api/afterMealComparisonApi';
import { saveMealReview } from '../api/mealLogApi';
import { readAfterMealDraft, saveAfterMealReview } from '../storage/afterMealReviewStorage';
import { mealLogKeys } from './mealLogQueries';

export const afterMealKeys = {
  draft: (childId: string, mealId: string) => ['after-meal-draft', childId, mealId] as const,
  result: (childId: string, mealId: string) => ['after-meal-review', childId, mealId] as const,
};

export function useAfterMealDraft(childId: string, mealId: string) {
  return useQuery({
    queryKey: afterMealKeys.draft(childId, mealId),
    queryFn: () => readAfterMealDraft(childId, mealId),
    enabled: !!childId && !!mealId,
  });
}

export function useCompareMealPhotos() {
  return useMutation({ mutationFn: compareMealPhotos, retry: false });
}

export function useSaveAfterMealReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (review: Parameters<typeof saveAfterMealReview>[0]) => {
      const saved = await saveAfterMealReview(review);
      await saveMealReview(saved);
      return saved;
    },
    retry: false,
    onSuccess: (review) => {
      client.setQueryData(afterMealKeys.result(review.childId, review.mealId), review);
      client.setQueryData(afterMealKeys.draft(review.childId, review.mealId), { ...review, step: 'complete', difficultyInputs: {} });
      void client.invalidateQueries({ queryKey: mealLogKeys.all(review.childId) });
    },
  });
}
