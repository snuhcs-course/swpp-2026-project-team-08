// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { useLocalSearchParams } from 'expo-router';
import { SuggestionScreen } from '../../features/home/screens/SuggestionScreen';

export default function SuggestionRoute() {
  const { id, mealId } = useLocalSearchParams<{ id: string; mealId?: string }>();
  return <SuggestionScreen id={id} mealId={typeof mealId === 'string' ? mealId : undefined} />;
}
