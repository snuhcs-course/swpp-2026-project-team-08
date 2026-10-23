// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/suggestionApi';
import type {
  Suggestion,
  SuggestionBatch,
  SuggestionDecision,
  SuggestionTry,
} from '../../types/suggestion';
import { mealLogKeys } from './mealLogQueries';

export const suggestionKeys = {
  child: (child: string) => ['suggestions', child] as const,
  saved: (child: string) => ['suggestions', child, 'saved'] as const,
  batch: (child: string, meal: string) => ['suggestions', child, 'batch', meal] as const,
  detail: (child: string, id: string) => ['suggestions', child, 'detail', id] as const,
  eligible: (child: string, id: string) => ['suggestions', child, 'eligible', id] as const,
};
export const useSuggestionBatch = (child: string, meal: string) =>
  useQuery({
    queryKey: suggestionKeys.batch(child, meal),
    queryFn: ({ signal }) => api.generateSuggestions(child, meal, undefined, signal),
    enabled: !!child && !!meal,
    retry: false,
    staleTime: 0,
  });
export const useSavedSuggestions = (child: string) =>
  useQuery({
    queryKey: suggestionKeys.saved(child),
    queryFn: ({ signal }) => api.savedSuggestions(child, signal),
    enabled: !!child,
    retry: false,
    staleTime: 0,
  });
export const useSuggestionDetail = (child: string, id: string) =>
  useQuery({
    queryKey: suggestionKeys.detail(child, id),
    queryFn: ({ signal }) => api.getSuggestion(child, id, signal),
    enabled: !!child && !!id,
    retry: false,
  });
export const useEligibleMeals = (child: string, id: string, enabled: boolean) =>
  useQuery({
    queryKey: suggestionKeys.eligible(child, id),
    queryFn: ({ signal }) => api.eligibleMeals(child, id, signal),
    enabled: enabled && !!child && !!id,
    retry: false,
    staleTime: 0,
  });

export function useSuggestionActions(child: string, meal = '') {
  const client = useQueryClient();
  const scope = useRef({ child, active: true });
  useEffect(() => {
    scope.current = { child, active: true };
    return () => {
      scope.current.active = false;
    };
  }, [child]);
  const update = async (item: Suggestion) => {
    if (!scope.current.active || scope.current.child !== child || item.child_id !== child) return;
    client.setQueryData(suggestionKeys.detail(child, item.id), item);
    client.setQueryData<SuggestionBatch>(
      suggestionKeys.batch(child, meal || item.meal_id),
      (old) =>
        old && {
          ...old,
          items: old.items.map((i) => (i.id === item.id ? item : i)),
        },
    );
    await Promise.all([
      client.invalidateQueries({ queryKey: suggestionKeys.saved(child) }),
      client.invalidateQueries({ queryKey: mealLogKeys.all(child) }),
    ]);
  };
  const select = useMutation({
    mutationFn: (ids: string[]) => api.generateSuggestions(child, meal, ids),
    retry: false,
    onSuccess: (batch) => {
      if (scope.current.active && scope.current.child === child)
        client.setQueryData(suggestionKeys.batch(child, meal), batch);
    },
  });
  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: SuggestionDecision }) =>
      api.decideSuggestion(child, id, decision),
    retry: false,
    onSuccess: update,
  });
  const undo = useMutation({
    mutationFn: ({ id, actionId }: { id: string; actionId: string }) =>
      api.undoSuggestion(child, id, actionId),
    retry: false,
    onSuccess: update,
  });
  const save = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      api.setSuggestionSaved(child, id, saved),
    retry: false,
    onSuccess: update,
  });
  const tried = useMutation({
    mutationFn: ({ id, mealId, targetId }: { id: string; mealId: string; targetId: string }) =>
      api.recordSuggestionTry(child, id, mealId, targetId),
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: suggestionKeys.child(child) }),
  });
  const feedback = useMutation({
    mutationFn: ({
      id,
      tryId,
      value,
    }: {
      id: string;
      tryId: string;
      value: NonNullable<SuggestionTry['feedback']>;
    }) => api.saveSuggestionFeedback(child, id, tryId, value),
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: suggestionKeys.child(child) }),
  });
  return { select, decide, undo, save, tried, feedback };
}
