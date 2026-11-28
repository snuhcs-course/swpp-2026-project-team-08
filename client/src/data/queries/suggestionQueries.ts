// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 추가 추천 결과 캐시 반영과 중복 제거
// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 기록을 보존하는 저장 목록 제거와 늦은 조회 응답 취소
// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 홈 새로고침을 위한 사용자별 추천 캐시 키 추가
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 추천 카드의 생성·결정 상태 공유와 오프라인 요청 실패 처리
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 재생성 요청 ID 없이 추천 한 장을 생성

import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DismissReason, Suggestion } from '../../types/suggestionRecord';
import { decideSuggestion, generateSuggestion, removeSavedSuggestion, undoSuggestion } from '../api/suggestionApi';
import { checkinReferenceKeys } from './checkinReferenceQueries';

export const suggestionKey = (userId: string, id: string | null) => ['suggestion', userId, id] as const;

// 홈 추천 한 장의 최신 상태는 추천 생성·결정 응답과 식사 저장 성공으로 갱신한다.
export function useCurrentSuggestion(userId: string, id: string | null) {
  return useQuery<Suggestion>({ queryKey: suggestionKey(userId, id), queryFn: skipToken }).data ?? null;
}

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
  const updateCard = (item: Suggestion) => client.setQueryData(suggestionKey(userId, item.id), item);
  const refreshSaved = () => {
    void client.invalidateQueries({ queryKey: checkinReferenceKeys.savedSuggestions(userId) });
  };
  const generate = useMutation({
    mutationFn: () => generateSuggestion(userId),
    onSuccess: updateCard,
    networkMode: 'always',
    retry: false,
  });
  const decide = useMutation({
    mutationFn: ({ id, status, reasons }: {
      id: string; status: 'saved' | 'dismissed'; reasons?: DismissReason[];
    }) => decideSuggestion(userId, id, status, reasons),
    onSuccess: item => {
      updateCard(item);
      refreshSaved();
    },
    networkMode: 'always',
    retry: false,
  });
  const undo = useMutation({
    mutationFn: (id: string) => undoSuggestion(userId, id),
    networkMode: 'always',
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
      updateCard(item);
      client.setQueryData<Suggestion[]>(checkinReferenceKeys.savedSuggestions(userId),
        (old) => old?.filter((entry) => entry.id !== item.id));
    },
    onSettled: refreshSaved,
  });
  return { generate, decide, undo };
}
