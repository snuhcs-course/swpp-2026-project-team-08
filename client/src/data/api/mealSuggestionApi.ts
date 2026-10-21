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
    `/api/v1/meals/${encodeURIComponent(mealId)}/suggestions?status=all`, { signal },
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
  const targetKeys = new Set(targets.map((target) => `${target.foodId}:${target.ingredientId ?? ''}`));
  const itemKeys = new Set(items.map((item) => `${item.foodId}:${item.ingredientId ?? ''}`));
  if (items.length !== targets.length || itemKeys.size !== targetKeys.size
    || items.some((item) => item.status !== 'pending'
      || !targetKeys.has(`${item.foodId}:${item.ingredientId ?? ''}`))) {
    throw new Error('Mismatched generated suggestions');
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
