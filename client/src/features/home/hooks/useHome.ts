import { useCallback, useEffect, useState } from 'react';
import { useSavedSuggestionsForCheckin } from '../../../data/queries/checkinReferenceQueries';
import { useMealList } from '../../../data/queries/mealLogQueries';
import { useMealDraft } from '../../../data/queries/mealQueries';
import { toLegacyMeal } from '../../../data/dto/mealLegacyDto';
import type { ChildProfile } from '../../../types/profile';
import { suggestionTargetName } from '../../suggestions/components/GeneratedSuggestionBody';

export function useHome(profile: ChildProfile) {
  const meals = useMealList(profile.id, null);
  const saved = useSavedSuggestionsForCheckin(profile.id);
  const draft = useMealDraft(profile.id);
  const [now, setNow] = useState(() => new Date());
  const refetchMeals = meals.refetch;
  const refetchSaved = saved.refetch;
  const refetchDraft = draft.refetch;
  const refresh = useCallback(() => Promise.all([refetchMeals(), refetchSaved(), refetchDraft()]),
    [refetchMeals, refetchSaved, refetchDraft]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const details = meals.data ?? [];
  const storedMeals = details.map(toLegacyMeal);
  const suggestions = (saved.data ?? []).map((item) => ({
    id: item.id, title: suggestionTargetName(item), description: item.whatToTry,
  }));
  return {
    now,
    pendingMeals: details.filter((item) => item.review === null).map(toLegacyMeal),
    storedMeals,
    draft: draft.data?.step !== 'complete' ? (draft.data ?? null) : null,
    lastSavedMealId: draft.data?.savedMealId ?? undefined,
    draftLoading: draft.isPending,
    draftError: draft.isError,
    data: { loggedDates: new Set(details.map((item) => item.mealDate)), suggestions },
    loading: meals.isPending || saved.isPending,
    error: meals.isError || saved.isError,
    refreshing: meals.isFetching || saved.isFetching,
    refresh,
  };
}
