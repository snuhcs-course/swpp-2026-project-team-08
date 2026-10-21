import { useQuery } from '@tanstack/react-query';
import { listIngredientCatalog } from '../api/ingredientCatalogApi';
import { listSavedSuggestions } from '../api/savedSuggestionListApi';
import { listMealDetails } from '../api/mealReadApi';

export const checkinReferenceKeys = {
  ingredients: ['ingredient-catalog'] as const,
  savedSuggestions: (userId: string) => ['saved-suggestions-v1', userId] as const,
  meals: (userId: string) => ['meal-details-v1', userId] as const,
};

export function useIngredientCatalog() {
  return useQuery({
    queryKey: checkinReferenceKeys.ingredients,
    queryFn: ({ signal }) => listIngredientCatalog(signal),
    staleTime: 5 * 60_000,
  });
}

export function useSavedSuggestionsForCheckin(userId: string) {
  return useQuery({
    queryKey: checkinReferenceKeys.savedSuggestions(userId),
    queryFn: ({ signal }) => listSavedSuggestions(signal),
    enabled: !!userId,
  });
}

export function useMealsForCheckin(userId: string) {
  return useQuery({
    queryKey: checkinReferenceKeys.meals(userId),
    queryFn: ({ signal }) => listMealDetails(signal),
    enabled: !!userId,
  });
}
