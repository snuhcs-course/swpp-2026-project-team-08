// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가

import { useLocalSearchParams } from 'expo-router';
import { SuggestionEntryScreen } from '../../features/suggestions/screens/SuggestionEntryScreen';

export default function SuggestionRoute() {
  const { id, mealId, tryMealId } = useLocalSearchParams<{ id: string; mealId?: string; tryMealId?: string }>();
  return <SuggestionEntryScreen id={id} tryMealId={tryMealId} mealId={typeof mealId === 'string' ? mealId : undefined} />;
}
