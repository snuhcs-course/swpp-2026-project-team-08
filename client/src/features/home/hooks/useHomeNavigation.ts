// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
import { useHomeMeals } from '../../../data/queries/homeQueries';
import { useMealDraft } from '../../../data/queries/mealQueries';

export function useHomeNavigation(childId: string) {
  const meals = useHomeMeals(childId);
  const draft = useMealDraft(childId);
  return !!childId && meals.isSuccess && !meals.data.length && draft.isSuccess && (!draft.data || draft.data.step === 'complete');
}
