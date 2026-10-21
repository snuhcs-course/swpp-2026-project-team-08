// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; initialize calendar from the selected home date
// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import { useCallback, useMemo, useState } from 'react';
import { validDate } from '../../../util/date';
import { useMealList } from '../../../data/queries/mealLogQueries';
import { useMealDraft } from '../../../data/queries/mealQueries';
import { filterMealDetails, monthKey, shiftMonth, sortMealDetailsLatestFirst } from '../rules';

// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
export function useMealLog(childId: string, initialDate?: string) {
  const validInitial = initialDate && validDate(initialDate) ? initialDate : null;
  const now = validInitial ? new Date(`${validInitial}T12:00:00`) : new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(validInitial);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
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
    () => sortMealDetailsLatestFirst(filterMealDetails(
      (list.data ?? []).filter((meal) => !selectedDate || meal.mealDate === selectedDate),
      query,
      unreviewedOnly,
    )),
    [list.data, query, selectedDate, unreviewedOnly],
  );

  const refetchList = list.refetch;
  const refetchDraft = draftQuery.refetch;

  const goMonth = useCallback((delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  }, [year, month, setYear, setMonth]);

  const setMonthYear = useCallback((nextYear: number, nextMonth: number) => {
    setYear(nextYear);
    setMonth(nextMonth);
  }, [setYear, setMonth]);

  const toggleDate = useCallback((value: string) => {
    setSelectedDate((current) => {
      if (current === value) return null;
      const [nextYear, nextMonth] = value.split('-').map(Number);
      setYear(nextYear);
      setMonth(nextMonth - 1);
      return value;
    });
  }, [setYear, setMonth]);

  const setSearchValue = useCallback((value: string) => {
    setSearch(value);
    if (!value.trim()) setQuery('');
  }, []);

  const refresh = useCallback(
    () => Promise.all([refetchList(), refetchDraft()]),
    [refetchList, refetchDraft],
  );

  return {
    year,
    month,
    selectedDate,
    search,
    query,
    setSearch: setSearchValue,
    submitSearch: () => setQuery(search.trim()),
    unreviewedOnly,
    setUnreviewedOnly,
    counts,
    meals,
    hasMeals: (list.data ?? []).length > 0,
    draft: draftQuery.data?.step !== 'complete' ? (draftQuery.data ?? null) : null,
    loading: list.isPending && !list.data,
    error: list.isError,
    refreshing: list.isFetching && !list.isPending,
    goMonth,
    setMonthYear,
    toggleDate,
    clearDate: () => setSelectedDate(null),
    retry: refresh,
  };
}
