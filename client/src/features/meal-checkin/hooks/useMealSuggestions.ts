// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; carry actual source meal date into suggestion cards
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천으로 바뀌어 근거 음식 이름을 원본 식사에서 찾음

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
        // 서버 추천에는 음식 스냅샷이 없으므로 근거 음식의 이름을 원본 식사에서 찾는다.
        title: sourceMeal?.foods.find((food) => food.id === item.foodId)?.name ?? '',
        description: item.whatToTry,
        servingTip: item.servingTip ?? undefined,
        mealDate: sourceMeal?.mealDate,
        mealType: sourceMeal?.mealType,
      };
    }),
    loading: query.isPending,
    error: query.isError,
    retry: () => { void query.refetch(); void meals.refetch(); },
  };
}
