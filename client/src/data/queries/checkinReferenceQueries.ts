// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 서버에서 삭제된 재료 카탈로그 조회 Hook 제거

import { useQuery } from '@tanstack/react-query';
import { listSavedSuggestions } from '../api/savedSuggestionListApi';
import { listMealDetails } from '../api/mealReadApi';

export const checkinReferenceKeys = {
  savedSuggestions: (userId: string) => ['saved-suggestions-v1', userId] as const,
  meals: (userId: string) => ['meal-details-v1', userId] as const,
};

export function useSavedSuggestionsForCheckin(userId: string) {
  return useQuery({
    queryKey: checkinReferenceKeys.savedSuggestions(userId),
    queryFn: ({ signal }) => listSavedSuggestions(signal),
    enabled: !!userId,
  });
}

export function useMealsForCheckin(userId: string) {
  return useQuery({
    queryKey: checkinReferenceKeys.meals(userId),
    queryFn: ({ signal }) => listMealDetails(signal),
    enabled: !!userId,
  });
}
