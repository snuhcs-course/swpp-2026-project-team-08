// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가

import { useLocalSearchParams } from 'expo-router';
import { RecommendationScreen } from '../../features/suggestions/screens/RecommendationScreen';

export default function RecommendationRoute() {
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  return <RecommendationScreen mealId={mealId ?? ''} />;
}
