// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 저장 목록에 시도한(tried) 추천 포함

import type { Suggestion } from '../../types/suggestionRecord';
import { toSuggestion } from '../dto/suggestionDto';
import { apiRequest } from '../network/apiClient';

export async function listSavedSuggestions(signal?: AbortSignal): Promise<Suggestion[]> {
  const response = await apiRequest<unknown>('/api/v1/suggestions', { signal });
  if (!Array.isArray(response)) throw new Error('Invalid saved suggestions');
  const suggestions = response.map(toSuggestion);
  // 저장한 추천과 시도한 추천이 함께 온다.
  if (suggestions.some((suggestion) => suggestion.status !== 'saved' && suggestion.status !== 'tried')) {
    throw new Error('Invalid saved suggestion status');
  }
  return suggestions;
}
