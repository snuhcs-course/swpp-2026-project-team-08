// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung

import { useHomeRecords } from '../../../data/queries/homeQueries';
import { useMeals } from '../../../data/queries/mealQueries';
import { useSavedSuggestions } from '../../../data/queries/suggestionQueries';
import { savedSuggestionsForProfile } from '../../../rules/savedSuggestions';
import type { ChildProfile } from '../../../types/profile';

export function useMealSuggestions(childId: string, profile: ChildProfile | null) {
  const home = useHomeRecords(childId);
  const meals = useMeals(childId);
  const remote = useSavedSuggestions(childId);
  const local = profile && home.data && meals.data ? savedSuggestionsForProfile(home.data, profile, meals.data) : [];
  const suggestions = [...local, ...(remote.data ?? []).filter((item) => item.status === 'saved').map((item) => ({ id: item.id, title: item.content.food_name, description: item.content.what_to_try, servingTip: item.content.serving_tip }))];
  return {
    suggestions,
    loading: home.isPending || meals.isPending || remote.isPending,
    error: !suggestions.length && (home.isError || meals.isError || remote.isError),
    retry: () => { void home.refetch(); void meals.refetch(); void remote.refetch(); },
  };
}
