import { useCallback, useEffect, useState } from 'react';
import { useMealDraft } from '../../../data/queries/mealQueries';
import { useHomeRecords } from '../../../data/queries/homeQueries';
import type { ChildProfile } from '../../../types/profile';
import { visibleHomeData } from '../rules';

export function useHome(profile: ChildProfile) {
  const query = useHomeRecords(profile.id);
  const draft = useMealDraft(profile.id);
  const refetchDraft = draft.refetch;
  const { refetch } = query;
  const [now, setNow] = useState(() => new Date());
  const refresh = useCallback(() => Promise.all([refetch(), refetchDraft()]), [refetch, refetchDraft]);
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
    data: query.data ? visibleHomeData(query.data, profile) : null,
    loading: query.isPending,
    error: query.isError,
    refreshing: query.isFetching && !query.isPending,
    refresh,
  };
}
