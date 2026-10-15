// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HomeRecords } from '../../types/home';
import {
  applySuggestionSaved,
  readHomeRecords,
  setSuggestionSaved,
  type SuggestionSavedDraft,
} from '../storage/homeStorage';

export const homeKeys = { byChild: (childId: string) => ['home', childId] as const };

export function useHomeRecords(childId: string) {
  return useQuery({ queryKey: homeKeys.byChild(childId), queryFn: () => readHomeRecords(childId), enabled: !!childId });
}

export function useSetSuggestionSaved() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      childId,
      suggestion,
      saved,
      profileUpdatedAt,
    }: {
      childId: string;
      suggestion: SuggestionSavedDraft;
      saved: boolean;
      profileUpdatedAt: string;
    }) => setSuggestionSaved(childId, suggestion, saved, profileUpdatedAt),
    retry: false,
    onMutate: async (vars) => {
      await client.cancelQueries({ queryKey: homeKeys.byChild(vars.childId) });
      const previous = client.getQueryData<HomeRecords>(homeKeys.byChild(vars.childId));
      client.setQueryData<HomeRecords>(homeKeys.byChild(vars.childId), (old) => {
        const records: HomeRecords = old
          ? { ...old, suggestions: old.suggestions.map((item) => ({ ...item })) }
          : { meals: [], exposures: [], suggestions: [] };
        applySuggestionSaved(records, vars.childId, vars.suggestion, vars.saved, vars.profileUpdatedAt);
        return records;
      });
      return { previous };
    },
    onError: (_error, vars, context) => {
      if (context?.previous) client.setQueryData(homeKeys.byChild(vars.childId), context.previous);
    },
    onSettled: (_data, _error, vars) => {
      void client.invalidateQueries({ queryKey: homeKeys.byChild(vars.childId) });
    },
  });
}
