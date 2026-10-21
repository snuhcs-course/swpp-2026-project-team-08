import { useCallback, useRef, useState } from 'react';
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
  const refetchSource = source.refetch;
  const refetchSuggestions = suggestions.refetch;
  useFocusEffect(useCallback(() => {
    void refetchSource();
    void refetchSuggestions();
  }, [refetchSource, refetchSuggestions]));

  const items = suggestions.data ?? [];
  const current = items.find((item) => item.status === 'pending') ?? null;
  const targetOptions = reviewedSuggestionTargets(source.data ?? null);
  const availableTargets = unGeneratedTargets(targetOptions, items);
  const targetItems = selectedTargets.length ? selectedTargets : items.map((item) => ({
    foodId: item.foodId, ingredientId: item.ingredientId,
  }));
  const visibleTargets = targetItems.filter((target, index) => targetItems.findIndex((item) =>
    item.foodId === target.foodId && item.ingredientId === target.ingredientId) === index);

  const selectTargets = async (targets: SuggestionTarget[]) => {
    if (busy.current || !targets.length || targets.some((target) => !availableTargets.some((option) =>
      option.target.foodId === target.foodId && option.target.ingredientId === target.ingredientId))) return false;
    busy.current = true;
    setGenerationFailed(false);
    setFailed(false);
    setSelectedTargets(targets);
    const oldIds = new Set(items.map((item) => item.id));
    try {
      await actions.generate.mutateAsync(targets);
      setNotice(null);
      return true;
    } catch {
      const refreshed = await suggestions.refetch().catch(() => null);
      const created = refreshed?.data?.some((item) => !oldIds.has(item.id)
        && targets.some((target) => target.foodId === item.foodId
          && target.ingredientId === item.ingredientId));
      setGenerationFailed(!created);
      return !!created;
    } finally {
      busy.current = false;
    }
  };
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
    busy: actions.generate.isPending || actions.decide.isPending || actions.undo.isPending,
    generating: actions.generate.isPending,
  };
}
