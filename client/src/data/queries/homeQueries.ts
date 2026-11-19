// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 홈 대상 식사의 전체 추천 조회와 새로고침 연결

import { useCallback } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { listMealSuggestions } from '../api/mealSuggestionApi';
import { mealSuggestionKeys } from './mealSuggestionQueries';

export const homeKeys = { byChild: (childId: string) => ['home', childId] as const };

export function useHomeMealSuggestions(userId: string, mealIds: readonly string[]) {
  const client = useQueryClient();
  const queries = useQueries({
    queries: mealIds.map((mealId) => ({
      queryKey: mealSuggestionKeys.all(userId, mealId),
      queryFn: ({ signal }: { signal: AbortSignal }) => listMealSuggestions(userId, mealId, signal),
      enabled: !!userId && !!mealId,
    })),
  });
  const refetch = useCallback(() => client.refetchQueries({
    queryKey: mealSuggestionKeys.byUser(userId), type: 'active',
  }), [client, userId]);

  return { queries, refetch };
}
