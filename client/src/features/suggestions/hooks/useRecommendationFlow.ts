// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Auto-generate food cards and reuse existing cards when targets change
// Changed: Automatically generate missing food cards for meals with one to three foods
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 추천 대상을 음식 단위로 비교
// AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
// Changed: 자동 생성 로직을 음식 단위 추천 위에 반영
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: Eaten 대상의 어려움·추천 제외 및 빈 단계 건너뛰기

// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 거절 직후 추가 생성 선택 단계와 실패 복구
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 추천 생성·재생성과 식사에 연결한 카드의 되돌리기 제한

import { uuid } from 'expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { isRegenerationLimitError } from '../../../data/api/suggestionApi';
import { useCurrentSuggestion, useSuggestionActions } from '../../../data/queries/suggestionQueries';
import type { DismissReason, Suggestion } from '../../../types/suggestionRecord';

function nextKstMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(15, 0, 0, 0); // 한국 시간 자정
  if (midnight <= now) midnight.setUTCDate(midnight.getUTCDate() + 1);
  return midnight.getTime();
}

export function useRecommendationFlow(userId: string) {
  const { generate, decide, undo } = useSuggestionActions(userId);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const current = useCurrentSuggestion(userId, currentId);
  const [limitResetsAt, setLimitResetsAt] = useState<number | null>(null);
  const inFlight = useRef(false);
  const { mutate: generateOne } = generate;

  useEffect(() => {
    if (limitResetsAt === null) return;
    const timeout = setTimeout(() => setLimitResetsAt(null), limitResetsAt - Date.now());
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active' && Date.now() >= limitResetsAt) setLimitResetsAt(null);
    });
    return () => { clearTimeout(timeout); listener.remove(); };
  }, [limitResetsAt]);

  const request = useCallback((requestId?: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    generateOne(requestId, {
      onSuccess: ({ suggestion, remainingRegenerations }) => {
        setCurrentId(suggestion.id);
        setLimitResetsAt(remainingRegenerations === 0 ? nextKstMidnight() : null);
      },
      onError: error => {
        if (isRegenerationLimitError(error)) setLimitResetsAt(nextKstMidnight());
      },
      onSettled: () => { inFlight.current = false; },
    });
  }, [generateOne]);
  useEffect(() => { request(); }, [request]);

  const regenerating = generate.isPending && generate.variables !== undefined;
  const regenerationFailed = generate.isError && generate.variables !== undefined
    && !isRegenerationLimitError(generate.error);
  const regenerate = () => {
    if (!current || current.status === 'pending' || inFlight.current || limitResetsAt !== null) return;
    undo.reset();
    const retryId = regenerationFailed ? generate.variables : undefined;
    request(retryId ?? uuid.v4());
  };

  const changeDecision = (
    status: 'saved' | 'dismissed' | 'pending',
    reasons: DismissReason[] = [],
    onSuccess?: (item: Suggestion) => void,
  ) => {
    if (!current || current.status === 'tried' || current.status === status || inFlight.current) return;
    inFlight.current = true;
    const callbacks = {
      onSuccess: (item: Suggestion) => {
        generate.reset();
        onSuccess?.(item);
      },
      onSettled: () => { inFlight.current = false; },
    };
    if (status === 'pending') undo.mutate(current.id, callbacks);
    else decide.mutate({ id: current.id, status, reasons }, callbacks);
  };

  return {
    current, request: () => request(), regenerate, changeDecision,
    generationFailed: generate.isError && generate.variables === undefined,
    regenerating, regenerationFailed, regenerationLimited: limitResetsAt !== null,
    busy: decide.isPending || undo.isPending || regenerating,
    decisionFailed: decide.isError || undo.isError,
  };
}
