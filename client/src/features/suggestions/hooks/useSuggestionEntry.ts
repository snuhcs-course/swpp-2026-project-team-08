// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useSuggestionDetail } from '../../../data/queries/suggestionQueries';
import { ApiError } from '../../../data/network/apiClient';

export function useSuggestionEntry(child: string, id: string) {
  const query = useSuggestionDetail(child, id);
  return { query, legacy: query.error instanceof ApiError && query.error.status === 404 };
}
