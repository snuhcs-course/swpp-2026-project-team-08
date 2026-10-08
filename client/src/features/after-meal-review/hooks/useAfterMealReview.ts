import { useMeal } from '../../../data/queries/mealQueries';

export function useAfterMealReview(childId: string, mealId: string) {
  const query = useMeal(childId, mealId);
  return {
    meal: query.data,
    loading: query.isPending,
    error: query.isError,
    retry: query.refetch,
  };
}
