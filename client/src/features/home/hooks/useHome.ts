// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 추천의 근거 음식 이름을 원본 식사에서 찾음
// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 식후 리뷰 대기 목록의 모델 변환 제거 및 홈 추천 조회 연결

import { useCallback, useEffect, useState } from 'react';
import { useSavedSuggestionsForCheckin } from '../../../data/queries/checkinReferenceQueries';
import { useMealList } from '../../../data/queries/mealLogQueries';
import { useMealDraft } from '../../../data/queries/mealQueries';
import { useHomeMealSuggestions } from '../../../data/queries/homeQueries';
import { toLegacyMeal } from '../../../data/dto/mealLegacyDto';
import type { ChildProfile } from '../../../types/profile';
import { suggestionTargetName } from '../../suggestions/components/GeneratedSuggestionBody';
import { getSuggestionTargetFoodIds, shouldShowSuggestionMeal } from '../rules';

export function useHome(profile: ChildProfile) {
  const meals = useMealList(profile.id, null);
  const saved = useSavedSuggestionsForCheckin(profile.id);
  const draft = useMealDraft(profile.id);
  const details = meals.data ?? [];
  const suggestionCandidates = details.filter((meal) => getSuggestionTargetFoodIds(meal).size > 0);
  const mealSuggestions = useHomeMealSuggestions(profile.id, suggestionCandidates.map(({ id }) => id));
  const [now, setNow] = useState(() => new Date());
  const refetchMeals = meals.refetch;
  const refetchSaved = saved.refetch;
  const refetchDraft = draft.refetch;
  const refetchSuggestions = mealSuggestions.refetch;
  const refresh = useCallback(() => Promise.all([
    refetchMeals(), refetchSaved(), refetchDraft(), refetchSuggestions(),
  ]), [refetchMeals, refetchSaved, refetchDraft, refetchSuggestions]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const storedMeals = details.map(toLegacyMeal);
  const suggestionMeals = suggestionCandidates.filter((meal, index) => {
    const suggestions = mealSuggestions.queries[index].data;
    // 최초 조회 실패는 미생성으로 처리하지 않으며, 재조회 실패 시 기존 결과를 유지한다.
    return suggestions !== undefined && shouldShowSuggestionMeal(meal, suggestions);
  });
  const suggestions = (saved.data ?? []).map((item) => ({
    id: item.id,
    title: suggestionTargetName(item, details.find((meal) => meal.id === item.mealId)),
    description: item.whatToTry,
  }));
  return {
    now,
    pendingMeals: details.filter((item) => item.review === null),
    suggestionMeals,
    suggestionMealsLoading: meals.isPending || mealSuggestions.queries.some((query) => query.isPending),
    suggestionMealsError: meals.isError || mealSuggestions.queries.some((query) => query.isError),
    storedMeals,
    draft: draft.data?.step !== 'complete' ? (draft.data ?? null) : null,
    lastSavedMealId: draft.data?.savedMealId ?? undefined,
    draftLoading: draft.isPending,
    draftError: draft.isError,
    data: { loggedDates: new Set(details.map((item) => item.mealDate)), suggestions },
    loading: meals.isPending || saved.isPending,
    error: meals.isError || saved.isError,
    refreshing: meals.isFetching || saved.isFetching
      || mealSuggestions.queries.some((query) => query.isFetching),
    refresh,
  };
}
