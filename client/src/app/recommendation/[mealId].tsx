// This Code is generated with AI

import { useLocalSearchParams } from 'expo-router';
import { RecommendationScreen } from '../../features/personalized-recommendation/screens/RecommendationScreen';

export default function RecommendationRoute() {
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  return <RecommendationScreen mealId={mealId ?? ''} />;
}
