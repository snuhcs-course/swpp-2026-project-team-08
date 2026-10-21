import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DismissReason, Suggestion, SuggestionTarget } from '../../types/suggestionRecord';
import {
  decideMealSuggestion, generateMealSuggestions, listMealSuggestions, undoMealSuggestion,
} from '../api/mealSuggestionApi';
import { checkinReferenceKeys } from './checkinReferenceQueries';

export const mealSuggestionKeys = {
  all: (userId: string, mealId: string) => ['meal-suggestions-v1', userId, mealId] as const,
};

export function useMealSuggestions(userId: string, mealId: string) {
  return useQuery({
    queryKey: mealSuggestionKeys.all(userId, mealId),
    queryFn: ({ signal }) => listMealSuggestions(userId, mealId, signal),
    enabled: !!userId && !!mealId,
  });
}

export function useMealSuggestionActions(userId: string, mealId: string) {
  const client = useQueryClient();
  const key = mealSuggestionKeys.all(userId, mealId);
  const refreshSaved = () => {
    void client.invalidateQueries({ queryKey: checkinReferenceKeys.savedSuggestions(userId) });
  };
  const generate = useMutation({
    mutationFn: (targets: SuggestionTarget[]) => generateMealSuggestions(userId, mealId, targets),
    retry: false,
    onSuccess: (created) => {
      client.setQueryData<Suggestion[]>(key, (old) => [...created, ...(old ?? [])]);
    },
  });
  const decide = useMutation({
    mutationFn: ({ id, status, reasons }: {
      id: string; status: 'saved' | 'dismissed'; reasons?: DismissReason[];
    }) => decideMealSuggestion(userId, id, status, reasons),
    retry: false,
    onSuccess: (item) => {
      client.setQueryData<Suggestion[]>(key, (old) => old?.map((entry) => entry.id === item.id ? item : entry));
      refreshSaved();
    },
  });
  const undo = useMutation({
    mutationFn: (id: string) => undoMealSuggestion(userId, id),
    retry: false,
    onMutate: async (id) => {
      const savedKey = checkinReferenceKeys.savedSuggestions(userId);
      await client.cancelQueries({ queryKey: savedKey });
      const previous = client.getQueryData<Suggestion[]>(savedKey);
      client.setQueryData<Suggestion[]>(savedKey, (old) => old?.filter((entry) => entry.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        client.setQueryData(checkinReferenceKeys.savedSuggestions(userId), context.previous);
      }
    },
    onSuccess: (item) => {
      client.setQueryData<Suggestion[]>(key, (old) => old?.map((entry) => entry.id === item.id ? item : entry));
      client.setQueryData<Suggestion[]>(checkinReferenceKeys.savedSuggestions(userId),
        (old) => old?.filter((entry) => entry.id !== item.id));
    },
    onSettled: refreshSaved,
  });
  return { generate, decide, undo };
}
