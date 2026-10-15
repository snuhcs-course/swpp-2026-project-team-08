// AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim

import { useCallback, useMemo, useState } from 'react';
import { useMealCalendar, useMealList } from '../../../data/queries/mealLogQueries';
import { useMealDraft } from '../../../data/queries/mealQueries';
import { countsByDate, filterMeals, isoDate, monthKey, shiftMonth } from '../rules';

export function useMealLog(childId: string) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);

  const monthValue = monthKey(year, month);
  const calendar = useMealCalendar(childId, monthValue);
  const list = useMealList(childId, selectedDate);
  const draftQuery = useMealDraft(childId);

  const counts = useMemo(() => countsByDate(calendar.data ?? []), [calendar.data]);
  const meals = useMemo(
    () => filterMeals(list.data ?? [], search, unreviewedOnly),
    [list.data, search, unreviewedOnly],
  );

  const refetchCalendar = calendar.refetch;
  const refetchList = list.refetch;
  const refetchDraft = draftQuery.refetch;

  const goMonth = useCallback((delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  }, [year, month]);

  const toggleDate = useCallback((day: number) => {
    const value = isoDate(year, month, day);
    setSelectedDate((current) => (current === value ? null : value));
  }, [year, month]);

  const refresh = useCallback(
    () => Promise.all([refetchCalendar(), refetchList(), refetchDraft()]),
    [refetchCalendar, refetchList, refetchDraft],
  );

  return {
    year,
    month,
    selectedDate,
    search,
    setSearch,
    unreviewedOnly,
    setUnreviewedOnly,
    counts,
    meals,
    draft: draftQuery.data?.step !== 'complete' ? (draftQuery.data ?? null) : null,
    loading: (calendar.isPending && !calendar.data) || (list.isPending && !list.data),
    error: calendar.isError || list.isError,
    refreshing: (calendar.isFetching || list.isFetching) && !calendar.isPending && !list.isPending,
    goMonth,
    toggleDate,
    clearDate: () => setSelectedDate(null),
    retry: refresh,
  };
}
