import { useCallback, useEffect, useState } from 'react';
import { useMealDraft, useMeals } from '../../../data/queries/mealQueries';
import { useHomeRecords } from '../../../data/queries/homeQueries';
import type { ChildProfile } from '../../../types/profile';
import { visibleHomeData } from '../rules';

export function useHome(profile: ChildProfile) {
  const query = useHomeRecords(profile.id);
  const draft = useMealDraft(profile.id);
  const meals = useMeals(profile.id);
  const refetchDraft = draft.refetch;
  const refetchMeals = meals.refetch;
  const { refetch } = query;
  const [now, setNow] = useState(() => new Date());
  const refresh = useCallback(() => Promise.all([refetch(), refetchDraft(), refetchMeals()]), [refetch, refetchDraft, refetchMeals]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return {
    now,
    draft: draft.data?.step !== 'complete' ? (draft.data ?? null) : null,
    lastSavedMealId: draft.data?.savedMealId ?? undefined,
    draftLoading: draft.isPending,
    draftError: draft.isError,
    data: query.data && meals.data ? visibleHomeData(query.data, profile, meals.data) : null,
    loading: query.isPending || meals.isPending,
    error: query.isError || meals.isError,
    refreshing: query.isFetching && !query.isPending,
    refresh,
  };
}
