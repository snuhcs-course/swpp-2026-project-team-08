import { SavedSuggestionsScreen } from './SavedSuggestionsScreen';

export function SuggestionEntryScreen({ id }: { id: string; mealId?: string; tryMealId?: string }) {
  return <SavedSuggestionsScreen initialId={id} />;
}
