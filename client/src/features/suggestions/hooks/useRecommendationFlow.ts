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
// Changed: 홈 진입당 추천 한 장을 요청하고 카드 결정 처리

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSuggestionActions } from '../../../data/queries/suggestionQueries';
import type { DismissReason, Suggestion } from '../../../types/suggestionRecord';

export function useRecommendationFlow(userId: string) {
  const { generate, decide, undo } = useSuggestionActions(userId);
  const [current, setCurrent] = useState<Suggestion | null>(null);
  const inFlight = useRef(false);
  const { mutate: generateOne } = generate;
  const request = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = true;
    generateOne(undefined, {
      onSuccess: setCurrent,
      onSettled: () => { inFlight.current = false; },
    });
  }, [generateOne]);
  useEffect(request, [request]);

  const changeDecision = (status: 'saved' | 'dismissed' | 'pending', reasons: DismissReason[] = []) => {
    if (!current || current.status === status || inFlight.current) return;
    inFlight.current = true;
    const callbacks = {
      onSuccess: setCurrent,
      onSettled: () => { inFlight.current = false; },
    };
    if (status === 'pending') undo.mutate(current.id, callbacks);
    else decide.mutate({ id: current.id, status, reasons }, callbacks);
  };

  return {
    current, request, changeDecision, generationFailed: generate.isError,
    busy: decide.isPending || undo.isPending,
    decisionFailed: decide.isError || undo.isError,
  };
}
