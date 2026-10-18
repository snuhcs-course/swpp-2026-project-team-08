// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useLocalSearchParams } from 'expo-router';
import { SuggestionEntryScreen } from '../../features/suggestions/screens/SuggestionEntryScreen';

export default function SuggestionRoute() {
  const { id, mealId, tryMealId } = useLocalSearchParams<{ id: string; mealId?: string; tryMealId?: string }>();
  return <SuggestionEntryScreen id={id} tryMealId={tryMealId} mealId={typeof mealId === 'string' ? mealId : undefined} />;
}
