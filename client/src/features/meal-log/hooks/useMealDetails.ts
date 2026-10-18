// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useState, useMemo } from 'react';
import { useHomeRecords, useSetSuggestionSaved } from '../../../data/queries/homeQueries';
import { useDeleteMeal, useMealDetail } from '../../../data/queries/mealLogQueries';
import { useSavedSuggestions, useSuggestionActions } from '../../../data/queries/suggestionQueries';
import { foodResponseCards } from '../rules';
import type { FoodResponseCard } from '../types';

export function useMealDetails(childId: string, mealId: string, profileUpdatedAt: string) {
  const detail = useMealDetail(childId, mealId);
  const home = useHomeRecords(childId);
  const serverSaved = useSavedSuggestions(childId);
  const serverActions = useSuggestionActions(childId);
  const [saveError, setSaveError] = useState(false);
  const del = useDeleteMeal();
  const save = useSetSuggestionSaved();
  const cards = useMemo(
    () => (detail.data ? foodResponseCards(detail.data.foods, detail.data.review, detail.data.suggestions) : []),
    [detail.data],
  );
  const savedSuggestionIds = useMemo(
    () => [...(serverSaved.data ?? []).map(i => i.id), ...(home.data?.suggestions ?? []).filter((item) => item.isSaved).map((item) => item.id)],
    [home.data, serverSaved.data],
  );
  return {
    meal: detail.data ?? null,
    cards,
    savedSuggestionIds,
    saveError,
    savingSuggestion: serverActions.save.isPending || save.isPending,
    loading: !!mealId && detail.isPending && !detail.data,
    error: !mealId || detail.isError,
    retry: detail.refetch,
    deleting: del.isPending,
    deleteError: del.isError,
    deleteMeal: () => del.mutateAsync({ childId, mealId }),
    toggleSaved: (card: FoodResponseCard, saved: boolean) => {
      if (!card.suggestion) return;
      setSaveError(false);
      if (card.suggestion.managed) {
        void serverActions.save.mutateAsync({ id: card.suggestion.id, saved }).catch(() => setSaveError(true));
        return;
      }
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
      }).catch(() => setSaveError(true));
    },
  };
}
