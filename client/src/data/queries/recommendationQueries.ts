// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { saveMealSuggestion } from '../api/mealLogApi';
import { readAfterMealReview } from '../storage/afterMealReviewStorage';
import { saveRecommendation } from '../storage/recommendationStorage';
import { afterMealKeys } from './afterMealReviewQueries';
import { homeKeys } from './homeQueries';
import { mealLogKeys } from './mealLogQueries';

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
    mutationFn: async (suggestion: Parameters<typeof saveRecommendation>[0]) => {
      const saved = await saveRecommendation(suggestion);
      await saveMealSuggestion(saved);
      return saved;
    },
    retry: false,
    onSuccess: (item) => {
      void client.invalidateQueries({ queryKey: homeKeys.byChild(item.childId) });
      void client.invalidateQueries({ queryKey: mealLogKeys.all(item.childId) });
    },
  });
}
