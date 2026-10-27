// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; carry actual source meal date into suggestion cards
// Changed: 화면 디자인 및 식사 흐름 개선

import {
  useMealsForCheckin,
  useSavedSuggestionsForCheckin,
} from '../../../data/queries/checkinReferenceQueries';

export function useMealSuggestions(userId: string) {
  const query = useSavedSuggestionsForCheckin(userId);
  const meals = useMealsForCheckin(userId);
  return {
    suggestions: (query.data ?? []).map((item) => {
      const sourceMeal = meals.data?.find((meal) => meal.id === item.mealId);
      return {
        id: item.id,
        title: item.foodSnapshot.name,
        description: item.whatToTry,
        servingTip: item.servingTip ?? undefined,
        ingredientId: item.ingredientId,
        ingredientName: item.foodSnapshot.ingredients.find((ingredient) => ingredient.id === item.ingredientId)?.name,
        mealDate: sourceMeal?.mealDate,
        mealType: sourceMeal?.mealType,
      };
    }),
    loading: query.isPending,
    error: query.isError,
    retry: () => { void query.refetch(); void meals.refetch(); },
  };
}
