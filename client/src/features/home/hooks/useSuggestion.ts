// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가

import { useHomeRecords } from '../../../data/queries/homeQueries';
import { useMealDetail } from '../../../data/queries/mealLogQueries';
import { useMeals } from '../../../data/queries/mealQueries';
import type { ChildProfile } from '../../../types/profile';
import { visibleHomeData } from '../rules';

export function useSuggestion(profile: ChildProfile, id: string, mealId?: string) {
  const query = useHomeRecords(profile.id);
  const meals = useMeals(profile.id);
  const linked = useMealDetail(profile.id, mealId ?? '');
  const item = query.data && meals.data
    ? visibleHomeData(query.data, profile, meals.data).suggestions.find((suggestion) => suggestion.id === id)
    : undefined;
  const link = linked.data?.suggestionLinks.find((suggestion) => suggestion.suggestionId === id);
  const fromMeal = link && { title: link.suggestion.whatToTry,
    description: link.suggestion.whyThisMayHelp, servingTip: link.suggestion.servingTip };
  return {
    item,
    linked: fromMeal ?? null,
    loading: query.isPending || meals.isPending || (!!mealId && linked.isPending && !linked.data),
    error: query.isError || meals.isError,
    ready: query.isSuccess && meals.isSuccess && (!mealId || linked.isSuccess || !!fromMeal),
  };
}
