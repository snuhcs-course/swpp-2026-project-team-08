// This Code is generated with AI

import { useMeals } from '../../../data/queries/mealQueries';

export function useMealLog(childId: string) {
  const query = useMeals(childId);
  return { meals: query.data ?? [], loading: query.isPending, error: query.isError, retry: query.refetch };
}
