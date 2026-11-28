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
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 재생성 요청 ID와 일일 한도 없이 추천을 한 장씩 생성·재생성

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentSuggestion, useSuggestionActions } from '../../../data/queries/suggestionQueries';
import type { DismissReason, Suggestion } from '../../../types/suggestionRecord';

export function useRecommendationFlow(userId: string) {
  const { generate, decide, undo } = useSuggestionActions(userId);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const current = useCurrentSuggestion(userId, currentId);
  // 마지막 생성 요청이 결정한 카드 다음의 새 추천(재생성)이었는지. 첫 생성 실패와 구분한다.
  const [regenerationRequested, setRegenerationRequested] = useState(false);
  const inFlight = useRef(false);
  const { mutate: generateOne } = generate;

  const request = useCallback((regeneration: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRegenerationRequested(regeneration);
    generateOne(undefined, {
      onSuccess: suggestion => { setCurrentId(suggestion.id); },
      onSettled: () => { inFlight.current = false; },
    });
  }, [generateOne]);
  useEffect(() => { request(false); }, [request]);

  const regenerating = generate.isPending && regenerationRequested;
  const regenerationFailed = generate.isError && regenerationRequested;
  const regenerate = () => {
    if (!current || current.status === 'pending' || inFlight.current) return;
    undo.reset();
    request(true);
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
    current, request: () => request(false), regenerate, changeDecision,
    generationFailed: generate.isError && !regenerationRequested,
    regenerating, regenerationFailed,
    busy: decide.isPending || undo.isPending || regenerating,
    decisionFailed: decide.isError || undo.isError,
  };
}
