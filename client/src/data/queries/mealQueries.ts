import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recognizeMealPhoto } from '../api/recognitionApi';
import { readMeal, readMealDraft, saveMeal } from '../storage/mealStorage';
import { homeKeys } from './homeQueries';
export const mealKeys = {
  draft: (childId: string) => ['meal-draft', childId] as const,
  detail: (childId: string, id: string) => ['meal', childId, id] as const,
};
export const useMealDraft = (childId: string) => useQuery({ queryKey: mealKeys.draft(childId), queryFn: () => readMealDraft(childId), enabled: !!childId });
export const useMeal = (childId: string, id: string) => useQuery({ queryKey: mealKeys.detail(childId, id), queryFn: () => readMeal(childId, id), enabled: !!childId && !!id });
export const useRecognition = () => useMutation({ mutationFn: recognizeMealPhoto, retry: false });
export function useSaveMeal() {
  const client = useQueryClient();
  return useMutation({ mutationFn: saveMeal, retry: false, onSuccess: (meal) => {
    client.setQueryData(mealKeys.detail(meal.childId, meal.id), meal);
    void client.invalidateQueries({ queryKey: homeKeys.byChild(meal.childId) });
    void client.invalidateQueries({ queryKey: mealKeys.draft(meal.childId) });
  } });
}
