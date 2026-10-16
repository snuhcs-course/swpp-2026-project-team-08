// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { useMemo } from 'react';
import { useHomeRecords, useSetSuggestionSaved } from '../../../data/queries/homeQueries';
import { useDeleteMeal, useMealDetail } from '../../../data/queries/mealLogQueries';
import { foodResponseCards } from '../rules';
import type { FoodResponseCard } from '../types';

export function useMealDetails(childId: string, mealId: string, profileUpdatedAt: string) {
  const detail = useMealDetail(childId, mealId);
  const home = useHomeRecords(childId);
  const del = useDeleteMeal();
  const save = useSetSuggestionSaved();
  const cards = useMemo(
    () => (detail.data ? foodResponseCards(detail.data.foods, detail.data.review, detail.data.suggestions) : []),
    [detail.data],
  );
  const savedSuggestionIds = useMemo(
    () => (home.data?.suggestions ?? []).filter((item) => item.isSaved).map((item) => item.id),
    [home.data],
  );
  return {
    meal: detail.data ?? null,
    cards,
    savedSuggestionIds,
    loading: !!mealId && detail.isPending && !detail.data,
    error: !mealId || detail.isError,
    retry: detail.refetch,
    deleting: del.isPending,
    deleteError: del.isError,
    deleteMeal: () => del.mutateAsync({ childId, mealId }),
    toggleSaved: (card: FoodResponseCard, saved: boolean) => {
      if (!card.suggestion) return;
      void save.mutateAsync({
        childId,
        suggestion: {
          id: card.suggestion.id,
          title: card.suggestion.title,
          description: card.suggestion.description,
          servingTip: card.suggestion.servingTip,
          ingredients: card.ingredients,
        },
        saved,
        profileUpdatedAt,
      }).catch(() => undefined);
    },
  };
}
