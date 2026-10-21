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
