// This Code is generated with AI

import { useCallback, useRef, useState } from 'react';
import { useHomeRecords } from '../../../data/queries/homeQueries';
import { useMeal } from '../../../data/queries/mealQueries';
import { useAfterMealResult, useSaveRecommendation } from '../../../data/queries/recommendationQueries';
import { recommendationText } from '../../../rules/recommendationPresentation';
import type { SavedSuggestion } from '../../../types/home';
import type { ChildProfile } from '../../../types/profile';
import { buildRecommendations, type RecommendationResult } from '../rules';

export function usePersonalizedRecommendation(profile: ChildProfile, mealId: string) {
  const meal = useMeal(profile.id, mealId);
  const review = useAfterMealResult(profile.id, mealId);
  const home = useHomeRecords(profile.id);
  const save = useSaveRecommendation();
  const [handled, setHandled] = useState<string[]>([]);
  const [saveError, setSaveError] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const busy = useRef(false);
  const refreshMeal = meal.refetch;
  const refreshReview = review.refetch;
  const refreshHome = home.refetch;
  const refresh = useCallback(() => Promise.all([refreshMeal(), refreshReview(), refreshHome()]),
    [refreshMeal, refreshReview, refreshHome]);
  const loading = meal.isPending || review.isPending || home.isPending
    || meal.isFetching || review.isFetching || home.isFetching;
  const error = meal.isError || review.isError || home.isError;
  const result = meal.data && review.data ? buildRecommendations(profile, meal.data, review.data) : null;
  const savedIds = new Set(home.data?.suggestions.filter((item) => item.isSaved).map((item) => item.id) ?? []);
  const candidates = result?.candidates.filter((item) => !savedIds.has(item.id)) ?? [];
  const current = candidates.find((item) => !handled.includes(item.id)) ?? null;

  const skip = () => {
    if (!current || busy.current) return;
    setHandled((old) => [...old, current.id]);
    setSaveError(false);
    setSavedNotice(false);
  };
  const saveCurrent = async () => {
    if (!current || busy.current) return;
    busy.current = true;
    setSaveError(false);
    setSavedNotice(false);
    const english = recommendationText(current, 'en', profile);
    const suggestion: SavedSuggestion = {
      id: current.id,
      childId: profile.id,
      title: english.title,
      description: english.description,
      servingTip: english.servingTip,
      ingredients: current.ingredients,
      isSaved: true,
      safetyVerifiedForProfileAt: profile.updatedAt,
      recommendation: {
        mealId: current.mealId,
        foodId: current.foodId,
        foodName: current.foodName,
        foodFormKey: current.foodFormKey,
        reviewSavedAt: current.reviewSavedAt,
        outcome: current.outcome,
        ...(current.difficulty ? { difficulty: current.difficulty } : {}),
        kind: current.kind,
      },
    };
    try {
      await save.mutateAsync(suggestion);
      setHandled((old) => [...old, current.id]);
      setSavedNotice(true);
    } catch {
      setSaveError(true);
      await refresh().catch(() => undefined);
    } finally {
      busy.current = false;
    }
  };
  return {
    meal: meal.data ?? null,
    review: review.data ?? null,
    loading, error, refresh,
    status: (result?.status ?? 'missing-record') as RecommendationResult['status'] | 'missing-record',
    current,
    hasCandidates: candidates.length > 0,
    saving: save.isPending,
    saveError, savedNotice,
    skip, saveCurrent,
  };
}
