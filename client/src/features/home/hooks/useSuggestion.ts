// This Code is generated with AI

import { useHomeRecords } from '../../../data/queries/homeQueries';
import { useMeals } from '../../../data/queries/mealQueries';
import type { ChildProfile } from '../../../types/profile';
import { visibleHomeData } from '../rules';

export function useSuggestion(profile: ChildProfile, id: string) {
  const query = useHomeRecords(profile.id);
  const meals = useMeals(profile.id);
  const item = query.data && meals.data
    ? visibleHomeData(query.data, profile, meals.data).suggestions.find((suggestion) => suggestion.id === id)
    : undefined;
  return { item, loading: query.isPending || meals.isPending, error: query.isError || meals.isError, ready: query.isSuccess && meals.isSuccess };
}
