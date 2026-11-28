// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천 대상과 대문자 조회 필터로 변경

// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 음식별 추가 추천 요청과 결과 검증
// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 추천 결정 취소와 저장 목록 제거 API 분리
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 추천 생성·재생성, 남은 재생성 횟수 확인 및 추천 결정 요청
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 재생성 ID·한도 없이 추천 한 장을 생성하고 LLM 생성 시간에 맞춘 대기 시간 적용

import type { DismissReason, Suggestion } from '../../types/suggestionRecord';
import { toSuggestion, toSuggestionDecision } from '../dto/suggestionDto';
import { apiRequest } from '../network/apiClient';

// 서버는 추천 생성(LLM 호출과 가드레일 판정)을 최대 60초 기다린다. 응답 전달 여유를 더한다.
const GENERATION_TIMEOUT_MS = 70_000;

export async function generateSuggestion(userId: string): Promise<Suggestion> {
  const item = toSuggestion(await apiRequest<unknown>('/api/v1/suggestions', {
    method: 'POST', signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
  }));
  if (item.userId !== userId || item.status !== 'pending') {
    throw new Error('Mismatched generated suggestion');
  }
  if (!item.whatToTry.trim() || !item.whyThisMayHelp.trim() || !item.preparationMethod?.trim()
    || !item.ingredients.length || item.ingredients.some(name => !name.trim())) {
    throw new Error('Incomplete generated suggestion');
  }
  return item;
}

export async function decideSuggestion(
  userId: string, suggestionId: string, status: 'saved' | 'dismissed',
  reasons: DismissReason[] = [],
): Promise<Suggestion> {
  const item = toSuggestion(await apiRequest<unknown>(
    `/api/v1/suggestions/${encodeURIComponent(suggestionId)}/decision`,
    { method: 'PUT', body: JSON.stringify(toSuggestionDecision(status, reasons)) },
  ));
  if (item.userId !== userId || item.id !== suggestionId || item.status !== status) {
    throw new Error('Mismatched suggestion');
  }
  return item;
}

export async function undoSuggestion(
  userId: string, suggestionId: string,
): Promise<Suggestion> {
  const item = toSuggestion(await apiRequest<unknown>(
    `/api/v1/suggestions/${encodeURIComponent(suggestionId)}/decision`, { method: 'DELETE' },
  ));
  if (item.userId !== userId || item.id !== suggestionId || item.status !== 'pending') {
    throw new Error('Mismatched suggestion undo');
  }
  return item;
}

export async function removeSavedSuggestion(suggestionId: string): Promise<void> {
  await apiRequest<void>(
    `/api/v1/suggestions/${encodeURIComponent(suggestionId)}/saved`, { method: 'DELETE' },
  );
}
