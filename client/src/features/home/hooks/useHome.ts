// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; load real saved meals awaiting after-meal review
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useCallback, useEffect, useState } from 'react';
import { useMealDraft, useMeals } from '../../../data/queries/mealQueries';
import { useHomeMeals, useHomeRecords } from '../../../data/queries/homeQueries';
import type { ChildProfile } from '../../../types/profile';
import { useSavedSuggestions } from '../../../data/queries/suggestionQueries';
import type { SavedSuggestion } from '../../../types/home';
import { pendingHomeMeals, visibleHomeData } from '../rules';

export function useHome(profile: ChildProfile) {
  const query = useHomeRecords(profile.id);
  const homeMeals = useHomeMeals(profile.id);
  const refetchHomeMeals = homeMeals.refetch;
  const saved = useSavedSuggestions(profile.id);
  const refreshSaved = saved.refetch;
  const draft = useMealDraft(profile.id);
  const meals = useMeals(profile.id);
  const refetchDraft = draft.refetch;
  const refetchMeals = meals.refetch;
  const { refetch } = query;
  const [now, setNow] = useState(() => new Date());
  const refresh = useCallback(() => Promise.all([refetch(), refetchDraft(), refetchMeals(), refreshSaved(), refetchHomeMeals()]), [refetch, refetchDraft, refetchMeals, refreshSaved, refetchHomeMeals]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const visible = query.data && meals.data ? visibleHomeData(query.data, profile, meals.data) : null;
  const remote: SavedSuggestion[] = (saved.data ?? []).map(item => ({
    id: item.id, childId: profile.id, title: item.content.food_name,
    description: item.content.what_to_try, servingTip: item.content.serving_tip,
    ingredients: item.content.ingredients, isSaved: true, safetyVerifiedForProfileAt: profile.updatedAt,
  }));
  return {
    now,
    pendingMeals: pendingHomeMeals(profile.id, homeMeals.data ?? []),
    storedMeals: (homeMeals.data ?? []).map(entry => entry.meal),
    draft: draft.data?.step !== 'complete' ? (draft.data ?? null) : null,
    lastSavedMealId: draft.data?.savedMealId ?? undefined,
    draftLoading: draft.isPending,
    draftError: draft.isError,
    data: visible ? { ...visible, suggestions: [...remote, ...visible.suggestions.filter(i => !remote.some(r => r.id === i.id))] } : null,
    loading: query.isPending || meals.isPending || homeMeals.isPending,
    error: query.isError || meals.isError || homeMeals.isError,
    refreshing: query.isFetching && !query.isPending,
    refresh,
  };
}
