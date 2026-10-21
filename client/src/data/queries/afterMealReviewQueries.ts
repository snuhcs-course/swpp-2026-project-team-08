// AI-generated with GPT-6, 2026-10-22, reviewed by Haechan Jung
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; revised manual after-meal flow
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { writeMealReview } from '../api/mealReviewApi';
import { readAfterMealDraft, saveAfterMealReview } from '../storage/afterMealReviewStorage';
import type { MealDetail } from '../../types/mealRecord';
import type { AfterMealReview } from '../../types/afterMealReview';
import { mealLogKeys } from './mealLogQueries';
import { mealKeys } from './mealQueryKeys';
import { checkinReferenceKeys } from './checkinReferenceQueries';

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


export function useSaveAfterMealReview() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ review, detail }: { review: AfterMealReview; detail: MealDetail }) => {
      const saved = await writeMealReview(review, detail);
      await saveAfterMealReview(review).catch(() => undefined);
      return { review, detail: saved };
    },
    retry: false,
    onSuccess: ({ review, detail }) => {
      client.setQueryData(afterMealKeys.result(review.childId, review.mealId), review);
      client.setQueryData(afterMealKeys.draft(review.childId, review.mealId), { ...review, step: 'complete', difficultyInputs: {} });
      client.setQueryData(mealKeys.detail(review.childId, review.mealId), detail);
      void client.invalidateQueries({ queryKey: checkinReferenceKeys.meals(review.childId) });
      void client.invalidateQueries({ queryKey: mealLogKeys.all(review.childId) });
    },
  });
}
