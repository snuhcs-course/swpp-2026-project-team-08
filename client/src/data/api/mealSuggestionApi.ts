// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천 대상과 대문자 조회 필터로 변경

// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 음식별 추가 추천 요청과 결과 검증
// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 추천 결정 취소와 저장 목록 제거 API 분리
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 식사별 조회에서 원본 음식 ID 확인

import type { Suggestion, SuggestionTarget } from '../../types/suggestionRecord';
import { toSuggestion, toSuggestionGenerate } from '../dto/suggestionDto';
import { apiRequest } from '../network/apiClient';

function suggestionList(value: unknown, mealId: string, userId: string) {
  if (!Array.isArray(value)) throw new Error('Invalid suggestion list');
  const items = value.map(toSuggestion);
  if (!items.every((item): item is Suggestion & { foodId: string } =>
    item.mealId === mealId && item.userId === userId && item.foodId !== null)) {
    throw new Error('Mismatched meal suggestion');
  }
  return items;
}

export async function listMealSuggestions(
  userId: string, mealId: string, signal?: AbortSignal,
) {
  const value = await apiRequest<unknown>(
    `/api/v1/meals/${encodeURIComponent(mealId)}/suggestions?status=ALL`, { signal },
  );
  return suggestionList(value, mealId, userId);
}

export async function generateMealSuggestions(
  userId: string, mealId: string, targets: SuggestionTarget[],
) {
  const value = await apiRequest<unknown>(
    `/api/v1/meals/${encodeURIComponent(mealId)}/suggestions`,
    { method: 'POST', body: JSON.stringify(toSuggestionGenerate(targets)) },
  );
  const items = suggestionList(value, mealId, userId);
  const targetFoods = new Set(targets.map((target) => target.foodId));
  if (items.length !== targets.length || new Set(items.map((item) => item.foodId)).size !== targetFoods.size
    || items.some((item) => !targetFoods.has(item.foodId))) {
    throw new Error('Mismatched generated suggestions');
  }
  for (const target of targets) {
    if (target.rejectedSuggestionId === undefined) continue;
    const item = items.find(entry => entry.foodId === target.foodId)!;
    if (item.replacementForId !== target.rejectedSuggestionId || item.id === target.rejectedSuggestionId) {
      throw new Error('Mismatched regenerated suggestion');
    }
  }
  return items;
}
