// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가

import { SavedSuggestionsScreen } from './SavedSuggestionsScreen';

export function SuggestionEntryScreen({ id }: { id: string; mealId?: string; tryMealId?: string }) {
  return <SavedSuggestionsScreen initialId={id} />;
}
