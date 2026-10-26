// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가

import { useMemo } from 'react';
import { useDeleteMeal, useMealDetail } from '../../../data/queries/mealLogQueries';
import { foodResponseCardsFromDetail } from '../rules';

export function useMealDetails(userId: string, mealId: string) {
  const detail = useMealDetail(userId, mealId);
  const del = useDeleteMeal();
  const cards = useMemo(() => detail.data ? foodResponseCardsFromDetail(detail.data) : [], [detail.data]);
  return {
    meal: detail.data ?? null,
    cards,
    loading: !!mealId && detail.isPending && !detail.data,
    error: !mealId || detail.isError,
    retry: detail.refetch,
    deleting: del.isPending,
    deleteError: del.isError,
    deleteMeal: () => del.mutateAsync({ childId: userId, mealId }),
  };
}
