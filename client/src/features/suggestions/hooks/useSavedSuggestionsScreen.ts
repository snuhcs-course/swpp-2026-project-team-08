import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSavedSuggestionsForCheckin, useMealsForCheckin } from '../../../data/queries/checkinReferenceQueries';
import { useMealSuggestionActions } from '../../../data/queries/mealSuggestionQueries';

export function useSavedSuggestionsScreen(userId: string, initialId: string) {
  const saved = useSavedSuggestionsForCheckin(userId);
  const meals = useMealsForCheckin(userId);
  const [selectedId, setSelectedId] = useState(initialId);
  const [removeFailed, setRemoveFailed] = useState(false);
  const selected = saved.data?.find((item) => item.id === selectedId) ?? null;
  const actions = useMealSuggestionActions(userId, selected?.mealId ?? '');
  const refetchSaved = saved.refetch;
  const refetchMeals = meals.refetch;
  useFocusEffect(useCallback(() => {
    void refetchSaved();
    void refetchMeals();
  }, [refetchSaved, refetchMeals]));
  const linkedMeals = (meals.data ?? []).filter((meal) => meal.suggestionLinks.some((link) => link.suggestionId === selectedId));
  const close = () => {
    setSelectedId('');
    setRemoveFailed(false);
  };
  const remove = async () => {
    if (!selected || actions.undo.isPending) return false;
    const id = selected.id;
    setRemoveFailed(false);
    close();
    try {
      await actions.undo.mutateAsync(id);
      return true;
    } catch {
      setSelectedId(id);
      setRemoveFailed(true);
      return false;
    }
  };
  return {
    saved, meals, selectedId, selected, linkedMeals, removeFailed,
    removing: actions.undo.isPending, setSelectedId, close, remove,
    sourceMeal: (id: string) => meals.data?.find((meal) => meal.id === id),
  };
}
