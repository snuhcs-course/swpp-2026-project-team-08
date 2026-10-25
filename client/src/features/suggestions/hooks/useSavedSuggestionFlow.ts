// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  useEligibleMeals,
  useSavedSuggestions,
  useSuggestionActions,
  useSuggestionDetail,
} from '../../../data/queries/suggestionQueries';
import { mealLogKeys } from '../../../data/queries/mealLogQueries';
import { getMealDetail } from '../../../data/api/mealLogApi';
import { ApiError } from '../../../data/network/apiClient';
import type { EligibleMeal, Suggestion, SuggestionTry } from '../../../types/suggestion';

export type SavedMode = 'list' | 'select' | 'confirm' | 'feedback';
export function useSavedSuggestionFlow(
  child: string,
  initialId = '',
  newMealId = '',
  onFinish?: () => void,
) {
  const list = useSavedSuggestions(child);
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState(initialId);
  const detail = useSuggestionDetail(child, selectedId);
  const actions = useSuggestionActions(child);
  const [mode, setMode] = useState<SavedMode>(newMealId ? 'confirm' : 'list');
  const [menu, setMenu] = useState(false);
  const [mealId, setMealId] = useState(newMealId);
  const [targetId, setTargetId] = useState('');
  const [tried, setTried] = useState<SuggestionTry | null>(null);
  const [feedback, setFeedback] = useState<SuggestionTry['feedback']>(null);
  const [error, setError] = useState<
    'remove' | 'changed' | 'try' | 'feedback' | 'unavailable' | 'linked' | null
  >(null);
  const [removed, setRemoved] = useState(false);
  const [openingMeal, setOpeningMeal] = useState(false);
  const eligible = useEligibleMeals(child, selectedId, mode === 'select' || mode === 'confirm');
  const item =
    detail.data?.id === selectedId ? detail.data : list.data?.find((i) => i.id === selectedId);
  const selectedMeal = eligible.data?.find((m) => m.id === mealId) ?? null;
  const mounted = useRef(true);
  const busy = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const refreshList = list.refetch;
  const refreshDetail = detail.refetch;
  const refreshEligible = eligible.refetch;
  useFocusEffect(
    useCallback(() => {
      void refreshList();
      if (selectedId) void refreshDetail();
      if (mode === 'select' || mode === 'confirm') void refreshEligible();
    }, [refreshList, refreshDetail, refreshEligible, selectedId, mode]),
  );
  const unavailable = !!item && !item.saved_at && !actions.save.isPending && mode !== 'feedback';
  const missingSelection = mode === 'confirm' && eligible.isSuccess && !selectedMeal;
  const effectiveMode = unavailable ? 'list' : missingSelection ? 'select' : mode;
  const effectiveError = unavailable ? 'unavailable' : error;
  const validTarget = selectedMeal?.targets.some((t) => t.id === targetId) ? targetId : '';
  const open = (value: Suggestion) => {
    setSelectedId(value.id);
    setError(null);
    setRemoved(false);
    setMenu(false);
  };
  const close = () => {
    if (busy.current) return;
    if (menu) setMenu(false);
    else {
      setSelectedId('');
      setError(null);
      onFinish?.();
    }
  };
  const startLink = () => {
    setMenu(false);
    setMealId('');
    setTargetId('');
    setError(null);
    setMode('select');
  };
  const finish = () => {
    setFeedback(null);
    setTried(null);
    setSelectedId('');
    setMode('list');
    setError(null);
    onFinish?.();
  };
  const back = () => {
    if (busy.current) return;
    if (mode === 'feedback') finish();
    else if (mode === 'confirm') {
      setMode('select');
      setTargetId('');
    } else if (mode === 'select') {
      setMode('list');
      setMealId('');
      setTargetId('');
    } else close();
  };
  const remove = async () => {
    if (!item || busy.current) return;
    busy.current = true;
    setError(null);
    try {
      await actions.save.mutateAsync({ id: item.id, saved: false });
      if (mounted.current) {
        setSelectedId('');
        setMenu(false);
        setRemoved(true);
      }
    } catch {
      if (mounted.current) setError('remove');
    } finally {
      busy.current = false;
    }
  };
  const confirm = async () => {
    if (!item || !selectedMeal || !targetId || busy.current) return;
    busy.current = true;
    setError(null);
    try {
      const saved = await actions.tried.mutateAsync({
        id: item.id,
        mealId: selectedMeal.id,
        targetId,
      });
      if (mounted.current) {
        setTried(saved);
        setFeedback(null);
        setMode('feedback');
      }
    } catch (error) {
      if (!mounted.current) return;
      if (
        error instanceof ApiError &&
        ['SELECTION_CHANGED', 'SOURCE_UNAVAILABLE'].includes(error.errorCode)
      ) {
        setError('changed');
        setMealId('');
        setTargetId('');
        setMode('select');
        void eligible.refetch();
      } else setError('try');
    } finally {
      busy.current = false;
    }
  };
  const saveFeedback = async () => {
    if (!item || !tried || !feedback || busy.current) return;
    busy.current = true;
    setError(null);
    try {
      await actions.feedback.mutateAsync({ id: item.id, tryId: tried.id, value: feedback });
      if (mounted.current) finish();
    } catch {
      if (mounted.current) setError('feedback');
    } finally {
      busy.current = false;
    }
  };
  const showLinked = async (trial: SuggestionTry) => {
    if (busy.current) return null;
    if (!trial.linked_available || !item?.tries.some((value) => value.id === trial.id)) {
      setError('linked');
      return null;
    }
    busy.current = true;
    setOpeningMeal(true);
    setError(null);
    try {
      const meal = await client.fetchQuery({
        queryKey: mealLogKeys.detail(child, trial.meal_id),
        queryFn: () => getMealDetail(child, trial.meal_id),
        staleTime: 0,
      });
      if (!mounted.current) return null;
      if (meal.id !== trial.meal_id || meal.childId !== child) {
        setError('linked');
        return null;
      }
      setMenu(false);
      return meal.id;
    } catch {
      if (mounted.current) setError('linked');
      return null;
    } finally {
      busy.current = false;
      if (mounted.current) setOpeningMeal(false);
    }
  };
  return {
    list,
    detail,
    item: item ?? null,
    selectedId: unavailable ? '' : selectedId,
    mode: effectiveMode,
    menu,
    setMenu,
    eligible,
    selectedMeal,
    mealId,
    targetId: validTarget,
    setTargetId,
    tried,
    feedback,
    setFeedback,
    error: effectiveError,
    removed,
    open,
    close,
    startLink,
    finish,
    back,
    remove,
    confirm,
    saveFeedback,
    showLinked,
    setMode,
    busy: openingMeal || actions.save.isPending || actions.tried.isPending || actions.feedback.isPending,
    chooseMeal: (meal: EligibleMeal) => {
      setMealId(meal.id);
      setTargetId('');
    },
    continueMeal: () => {
      if (selectedMeal && !eligible.isFetching && !eligible.isError) {
        setMode('confirm');
        setTargetId('');
      }
    },
  };
}
