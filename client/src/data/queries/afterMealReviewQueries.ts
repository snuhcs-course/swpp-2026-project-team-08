// This Code is generated with AI

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { compareMealPhotos } from '../api/afterMealComparisonApi';
import { readAfterMealDraft, saveAfterMealReview } from '../storage/afterMealReviewStorage';

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
    mutationFn: saveAfterMealReview,
    retry: false,
    onSuccess: (review) => {
      client.setQueryData(afterMealKeys.result(review.childId, review.mealId), review);
      client.setQueryData(afterMealKeys.draft(review.childId, review.mealId), { ...review, step: 'complete', difficultyInputs: {} });
    },
  });
}
