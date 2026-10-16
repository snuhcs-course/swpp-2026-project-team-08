// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { useCallback, useMemo, useState } from 'react';
import { useMealList } from '../../../data/queries/mealLogQueries';
import { useMealDraft } from '../../../data/queries/mealQueries';
import { filterMeals, isoDate, monthKey, shiftMonth } from '../rules';

export function useMealLog(childId: string) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [unreviewedOnly, setUnreviewedOnly] = useState(false);

  const monthValue = monthKey(year, month);
  const list = useMealList(childId, null);
  const draftQuery = useMealDraft(childId);

  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    for (const meal of list.data ?? []) {
      if (!meal.mealDate.startsWith(`${monthValue}-`)) continue;
      next[meal.mealDate] = (next[meal.mealDate] ?? 0) + 1;
    }
    return next;
  }, [list.data, monthValue]);
  const meals = useMemo(
    () => filterMeals(
      (list.data ?? []).filter((meal) => !selectedDate || meal.mealDate === selectedDate),
      search,
      unreviewedOnly,
    ),
    [list.data, search, selectedDate, unreviewedOnly],
  );

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
    () => Promise.all([refetchList(), refetchDraft()]),
    [refetchList, refetchDraft],
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
    loading: list.isPending && !list.data,
    error: list.isError && !(list.data && list.data.length),
    refreshing: list.isFetching && !list.isPending,
    goMonth,
    toggleDate,
    clearDate: () => setSelectedDate(null),
    retry: refresh,
  };
}
