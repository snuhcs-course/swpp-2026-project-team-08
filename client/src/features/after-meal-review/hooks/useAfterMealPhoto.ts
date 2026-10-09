import { useAfterMealDraft } from '../../../data/queries/afterMealReviewQueries';
import { useMeal } from '../../../data/queries/mealQueries';

export function useAfterMealPhoto(childId: string, mealId: string, side: 'before' | 'after') {
  const meal = useMeal(childId, mealId);
  const draft = useAfterMealDraft(childId, mealId);
  return {
    photo: side === 'before' ? meal.data?.photo ?? null : draft.data?.afterPhoto ?? null,
    loading: meal.isPending || (side === 'after' && draft.isPending),
    error: meal.isError || (side === 'after' && draft.isError),
  };
}
