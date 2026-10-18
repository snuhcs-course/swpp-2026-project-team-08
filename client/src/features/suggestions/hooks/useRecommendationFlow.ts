// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useCallback, useRef, useState } from 'react';
import { ApiError } from '../../../data/network/apiClient';
import { useFocusEffect } from 'expo-router';
import { useSuggestionActions, useSuggestionBatch } from '../../../data/queries/suggestionQueries';
import { useMealDetail } from '../../../data/queries/mealLogQueries';
import type { DismissReason, SuggestionDecision } from '../../../types/suggestion';
import { actionId, nextSuggestion } from '../rules';

export function useRecommendationFlow(child: string, meal: string) {
  const batch = useSuggestionBatch(child, meal);
  const source = useMealDetail(child, meal);
  const actions = useSuggestionActions(child, meal);
  const [history, setHistory] = useState<{ id: string; actionId: string; revision: string }[]>([]);
  const [notice, setNotice] = useState<'saved' | 'dismissed' | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const pendingDecision = useRef<{ id: string; decision: SuggestionDecision } | null>(null);
  const current = nextSuggestion(batch.data);
  const refetch = batch.refetch;
  const refetchSource = source.refetch;
  useFocusEffect(
    useCallback(() => {
      void refetch();
      void refetchSource();
      return () => {
        setHistory([]);
        setNotice(null);
        pendingDecision.current = null;
      };
    }, [refetch, refetchSource]),
  );
  const decide = async (status: 'saved' | 'dismissed', reasons: DismissReason[] = []) => {
    if (!current || busy.current) return false;
    busy.current = true;
    setFailed(false);
    const previous = pendingDecision.current;
    const request =
      previous?.id === current.id
        ? previous
        : {
            id: current.id,
            decision: { action_id: actionId(), version: current.version, status, reasons },
          };
    pendingDecision.current = request;
    try {
      await actions.decide.mutateAsync(request);
      setHistory((old) => [
        ...old,
        { id: request.id, actionId: request.decision.action_id, revision: batch.data!.revision },
      ]);
      setNotice(request.decision.status);
      pendingDecision.current = null;
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      busy.current = false;
    }
  };
  const undo = async () => {
    const last = history.filter((h) => h.revision === batch.data?.revision).at(-1);
    if (!last || busy.current) return false;
    busy.current = true;
    setFailed(false);
    try {
      await actions.undo.mutateAsync(last);
      setHistory((old) => old.filter((h) => h.revision === batch.data?.revision).slice(0, -1));
      setNotice(null);
      pendingDecision.current = null;
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      busy.current = false;
    }
  };
  const selectFoods = async (ids: string[]) => {
    if (busy.current) return false;
    busy.current = true;
    setFailed(false);
    try {
      await actions.select.mutateAsync(ids);
      setHistory([]);
      setNotice(null);
      pendingDecision.current = null;
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      busy.current = false;
    }
  };
  return {
    batch,
    source,
    current,
    notice,
    failed,
    decide,
    undo,
    selectFoods,
    sourceUnavailable:
      batch.error instanceof ApiError && batch.error.errorCode === 'SOURCE_UNAVAILABLE',
    canUndo: history.some((h) => h.revision === batch.data?.revision),
    busy: actions.decide.isPending || actions.undo.isPending || actions.select.isPending,
    generating: actions.select.isPending || (batch.isPending && !batch.data),
  };
}
