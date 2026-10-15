// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { useMemo } from 'react';
import { useDeleteMeal, useMealDetail } from '../../../data/queries/mealLogQueries';
import { foodResponseCards } from '../rules';

export function useMealDetails(childId: string, mealId: string) {
  const detail = useMealDetail(childId, mealId);
  const del = useDeleteMeal();
  const cards = useMemo(
    () => (detail.data ? foodResponseCards(detail.data.foods, detail.data.review, detail.data.suggestions) : []),
    [detail.data],
  );
  return {
    meal: detail.data ?? null,
    cards,
    loading: !!mealId && detail.isPending && !detail.data,
    error: !mealId || detail.isError,
    retry: detail.refetch,
    deleting: del.isPending,
    deleteError: del.isError,
    deleteMeal: () => del.mutateAsync({ childId, mealId }),
  };
}
