import type { Suggestion } from '../../types/suggestionRecord';
import { toSuggestion } from '../dto/suggestionDto';
import { apiRequest } from '../network/apiClient';

export async function listSavedSuggestions(signal?: AbortSignal): Promise<Suggestion[]> {
  const response = await apiRequest<unknown>('/api/v1/suggestions', { signal });
  if (!Array.isArray(response)) throw new Error('Invalid saved suggestions');
  const suggestions = response.map(toSuggestion);
  if (suggestions.some((suggestion) => suggestion.status !== 'saved')) {
    throw new Error('Invalid saved suggestion status');
  }
  return suggestions;
}
