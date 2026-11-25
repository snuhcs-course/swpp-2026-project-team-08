// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 추가 추천 결과 캐시 반영과 중복 제거
// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 기록을 보존하는 저장 목록 제거와 늦은 조회 응답 취소
// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 홈 새로고침을 위한 사용자별 추천 캐시 키 추가
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 추천 생성·재생성 요청과 결정 후 저장 목록 갱신

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DismissReason, Suggestion } from '../../types/suggestionRecord';
import { decideSuggestion, generateSuggestion, removeSavedSuggestion, undoSuggestion } from '../api/suggestionApi';
import { checkinReferenceKeys } from './checkinReferenceQueries';

export function useRemoveSavedSuggestion(userId: string) {
  const client = useQueryClient();
  const savedKey = checkinReferenceKeys.savedSuggestions(userId);
  return useMutation({
    mutationFn: removeSavedSuggestion,
    retry: false,
    onSuccess: async (_result, id) => {
      await client.cancelQueries({ queryKey: savedKey });
      client.setQueryData<Suggestion[]>(savedKey, (old) => old?.filter((item) => item.id !== id));
      void client.invalidateQueries({ queryKey: savedKey });
    },
  });
}

export function useSuggestionActions(userId: string) {
  const client = useQueryClient();
  const refreshSaved = () => {
    void client.invalidateQueries({ queryKey: checkinReferenceKeys.savedSuggestions(userId) });
  };
  const generate = useMutation({
    mutationFn: (regenerationRequestId: string | undefined) =>
      generateSuggestion(userId, regenerationRequestId),
    networkMode: 'always',
    retry: false,
  });
  const decide = useMutation({
    mutationFn: ({ id, status, reasons }: {
      id: string; status: 'saved' | 'dismissed'; reasons?: DismissReason[];
    }) => decideSuggestion(userId, id, status, reasons),
    onSuccess: refreshSaved,
    retry: false,
  });
  const undo = useMutation({
    mutationFn: (id: string) => undoSuggestion(userId, id),
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
      client.setQueryData<Suggestion[]>(checkinReferenceKeys.savedSuggestions(userId),
        (old) => old?.filter((entry) => entry.id !== item.id));
    },
    onSettled: refreshSaved,
  });
  return { generate, decide, undo };
}
