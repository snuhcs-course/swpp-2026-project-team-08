// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Automatically generate missing food cards for meals with one to three foods
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 추천 대상을 음식 단위로 비교
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 자동 생성 로직을 음식 단위 추천 위에 반영

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ApiError } from '../../../data/network/apiClient';
import { useMealDetail } from '../../../data/queries/mealQueries';
import { useMealSuggestionActions, useMealSuggestions } from '../../../data/queries/mealSuggestionQueries';
import type { DismissReason, SuggestionTarget } from '../../../types/suggestionRecord';
import { reviewedSuggestionTargets, unGeneratedTargets } from '../rules';

export function useRecommendationFlow(userId: string, mealId: string) {
  const source = useMealDetail(userId, mealId);
  const suggestions = useMealSuggestions(userId, mealId);
  const actions = useMealSuggestionActions(userId, mealId);
  const [selectedTargets, setSelectedTargets] = useState<SuggestionTarget[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [notice, setNotice] = useState<'saved' | 'dismissed' | null>(null);
  const [failed, setFailed] = useState(false);
  const [generationFailed, setGenerationFailed] = useState(false);
  const busy = useRef(false);
  const automaticAttempt = useRef<string | null>(null);
  const refetchSource = source.refetch;
  const refetchSuggestions = suggestions.refetch;
  useFocusEffect(useCallback(() => {
    void refetchSource();
    void refetchSuggestions();
  }, [refetchSource, refetchSuggestions]));

  const items = useMemo(() => suggestions.data ?? [], [suggestions.data]);
  const current = items.find((item) => item.status === 'pending') ?? null;
  const targetOptions = useMemo(() => reviewedSuggestionTargets(source.data ?? null), [source.data]);
  const availableTargets = useMemo(() => unGeneratedTargets(targetOptions, items), [targetOptions, items]);
  const foodCount = source.data?.foods.length ?? 0;
  const autoSelect = !!source.data?.review && foodCount > 0 && foodCount <= 3;
  const awaitingAutomaticGeneration = autoSelect && source.isSuccess && suggestions.isSuccess
    && availableTargets.length > 0 && selectedTargets.length === 0 && !generationFailed;
  const generate = actions.generate.mutateAsync;
  const targetItems = selectedTargets.length ? selectedTargets : items.map((item) => ({
    foodId: item.foodId,
  }));
  const visibleTargets = targetItems.filter((target, index) => targetItems.findIndex((item) =>
    item.foodId === target.foodId) === index);

  const selectTargets = useCallback(async (targets: SuggestionTarget[]) => {
    if (busy.current || !targets.length || targets.length > 3
      || new Set(targets.map(target => target.foodId)).size !== targets.length
      || targets.some(target => !targetOptions.some(option => option.target.foodId === target.foodId))) return false;
    const missingTargets = targets.filter(target => availableTargets.some(option => option.target.foodId === target.foodId));
    if (!missingTargets.length) return false;
    busy.current = true;
    setGenerationFailed(false);
    setFailed(false);
    setSelectedTargets(targets);
    const oldIds = new Set(items.map((item) => item.id));
    try {
      await generate(missingTargets);
      setNotice(null);
      return true;
    } catch {
      const refreshed = await refetchSuggestions().catch(() => null);
      const created = missingTargets.every(target => refreshed?.data?.some(item => !oldIds.has(item.id)
        && target.foodId === item.foodId));
      setGenerationFailed(!created);
      return !!created;
    } finally {
      busy.current = false;
    }
  }, [availableTargets, targetOptions, items, generate, refetchSuggestions]);

  useEffect(() => {
    const scope = `${userId}:${mealId}`;
    if (!autoSelect || automaticAttempt.current === scope || busy.current || !availableTargets.length
      || !source.isSuccess || !suggestions.isSuccess || source.isFetching || suggestions.isFetching
      || !source.isFetchedAfterMount || !suggestions.isFetchedAfterMount) return;
    automaticAttempt.current = scope;
    void selectTargets(targetOptions.map(option => option.target));
  }, [userId, mealId, autoSelect, availableTargets, targetOptions, selectTargets, source.isSuccess, suggestions.isSuccess,
    source.isFetching, suggestions.isFetching, source.isFetchedAfterMount, suggestions.isFetchedAfterMount]);

  const decide = async (status: 'saved' | 'dismissed', reasons: DismissReason[] = []) => {
    if (!current || busy.current || (status === 'dismissed' && !reasons.length)) return false;
    busy.current = true;
    setFailed(false);
    try {
      await actions.decide.mutateAsync({ id: current.id, status, reasons });
      setHistory((old) => [...old, current.id]);
      setNotice(status);
      return true;
    } catch {
      const refreshed = await suggestions.refetch().catch(() => null);
      const saved = refreshed?.data?.find((item) => item.id === current.id);
      if (saved?.status === status) {
        setHistory((old) => [...old, current.id]);
        setNotice(status);
        return true;
      }
      setFailed(true);
      return false;
    } finally {
      busy.current = false;
    }
  };
  const undo = async () => {
    const id = history.at(-1);
    if (!id || busy.current) return false;
    busy.current = true;
    setFailed(false);
    try {
      await actions.undo.mutateAsync(id);
      setHistory((old) => old.slice(0, -1));
      setNotice(null);
      return true;
    } catch {
      const refreshed = await suggestions.refetch().catch(() => null);
      if (refreshed?.data?.find((item) => item.id === id)?.status === 'pending') {
        setHistory((old) => old.slice(0, -1));
        setNotice(null);
        return true;
      }
      setFailed(true);
      return false;
    } finally {
      busy.current = false;
    }
  };
  return {
    source, suggestions, items, current, targetOptions, availableTargets, visibleTargets,
    notice, failed, generationFailed, selectTargets, decide, undo,
    refresh: () => Promise.all([source.refetch(), suggestions.refetch()]),
    sourceUnavailable: source.error instanceof ApiError && source.error.status === 404,
    canUndo: history.length > 0,
    busy: awaitingAutomaticGeneration || actions.generate.isPending || actions.decide.isPending || actions.undo.isPending,
    generating: awaitingAutomaticGeneration || actions.generate.isPending,
  };
}
