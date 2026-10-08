import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useHomeRecords } from '../../../data/queries/homeQueries';
import type { ChildProfile } from '../../../types/profile';
import { visibleHomeData } from '../rules';

export function useHome(profile: ChildProfile) {
  const query = useHomeRecords(profile.id);
  const { refetch } = query;
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(useCallback(() => { void refetch(); }, [refetch]));
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return {
    now,
    data: query.data ? visibleHomeData(query.data, profile) : null,
    loading: query.isPending,
    error: query.isError,
    refreshing: query.isFetching && !query.isPending,
    refresh: query.refetch,
  };
}
