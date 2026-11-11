// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천 대상과 대문자 조회 필터로 변경

// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 음식별 추가 추천 요청과 결과 검증

import type { DismissReason, Suggestion, SuggestionTarget } from '../../types/suggestionRecord';
import { toSuggestion, toSuggestionDecision, toSuggestionGenerate } from '../dto/suggestionDto';
import { apiRequest } from '../network/apiClient';

function suggestionList(value: unknown, mealId: string, userId: string): Suggestion[] {
  if (!Array.isArray(value)) throw new Error('Invalid suggestion list');
  const items = value.map(toSuggestion);
  if (items.some((item) => item.mealId !== mealId || item.userId !== userId)) {
    throw new Error('Mismatched suggestion owner');
  }
  return items;
}

export async function listMealSuggestions(
  userId: string, mealId: string, signal?: AbortSignal,
): Promise<Suggestion[]> {
  const value = await apiRequest<unknown>(
    `/api/v1/meals/${encodeURIComponent(mealId)}/suggestions?status=ALL`, { signal },
  );
  return suggestionList(value, mealId, userId);
}

export async function generateMealSuggestions(
  userId: string, mealId: string, targets: SuggestionTarget[],
): Promise<Suggestion[]> {
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

export async function decideMealSuggestion(
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

export async function undoMealSuggestion(
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
