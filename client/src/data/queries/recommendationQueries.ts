// This Code is generated with AI

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readAfterMealReview } from '../storage/afterMealReviewStorage';
import { saveRecommendation } from '../storage/recommendationStorage';
import { afterMealKeys } from './afterMealReviewQueries';
import { homeKeys } from './homeQueries';

export function useAfterMealResult(childId: string, mealId: string) {
  return useQuery({
    queryKey: afterMealKeys.result(childId, mealId),
    queryFn: () => readAfterMealReview(childId, mealId),
    enabled: !!childId && !!mealId,
  });
}

export function useSaveRecommendation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: saveRecommendation,
    retry: false,
    onSuccess: (item) => { void client.invalidateQueries({ queryKey: homeKeys.byChild(item.childId) }); },
  });
}
