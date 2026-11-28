// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 저장 목록 제거 성공 전 상세 유지 및 중복 요청 차단
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 공통 추천 요청에서 저장 목록 제거
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 추천이 식사에 묶이지 않아 원본 식사 조회 제거

import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSavedSuggestionsForCheckin, useMealsForCheckin } from '../../../data/queries/checkinReferenceQueries';
import { useRemoveSavedSuggestion } from '../../../data/queries/suggestionQueries';

export function useSavedSuggestionsScreen(userId: string, initialId: string) {
  const saved = useSavedSuggestionsForCheckin(userId);
  const meals = useMealsForCheckin(userId);
  const [selectedId, selectId] = useState(initialId);
  const [removeFailed, setRemoveFailed] = useState(false);
  const [removeSucceeded, setRemoveSucceeded] = useState(false);
  const removingRef = useRef(false);
  const selected = saved.data?.find((item) => item.id === selectedId) ?? null;
  const removal = useRemoveSavedSuggestion(userId);
  const refetchSaved = saved.refetch;
  const refetchMeals = meals.refetch;
  useFocusEffect(useCallback(() => {
    void refetchSaved();
    void refetchMeals();
  }, [refetchSaved, refetchMeals]));
  const linkedMeals = (meals.data ?? []).filter((meal) => meal.suggestionLinks.some((link) => link.suggestionId === selectedId));
  const setSelectedId = (id: string) => {
    if (removingRef.current) return false;
    selectId(id);
    setRemoveFailed(false);
    setRemoveSucceeded(false);
    return true;
  };
  const close = () => setSelectedId('');
  const remove = async () => {
    if (!selected || removingRef.current) return false;
    removingRef.current = true;
    const id = selected.id;
    setRemoveFailed(false);
    setRemoveSucceeded(false);
    try {
      await removal.mutateAsync(id);
      selectId('');
      setRemoveSucceeded(true);
      return true;
    } catch {
      setRemoveFailed(true);
      return false;
    } finally {
      removingRef.current = false;
    }
  };
  return {
    saved, meals, selectedId, selected, linkedMeals, removeFailed, removeSucceeded,
    removing: removal.isPending, setSelectedId, close, remove,
  };
}
