// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가

import { useSuggestionDetail } from '../../../data/queries/suggestionQueries';
import { ApiError } from '../../../data/network/apiClient';

export function useSuggestionEntry(child: string, id: string) {
  const query = useSuggestionDetail(child, id);
  return { query, legacy: query.error instanceof ApiError && query.error.status === 404 };
}
