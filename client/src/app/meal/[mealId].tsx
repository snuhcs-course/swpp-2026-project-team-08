// AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim

import { useLocalSearchParams } from 'expo-router';
import { MealDetailsScreen } from '../../features/meal-log/screens/MealDetailsScreen';

export default function MealDetailsRoute() {
  const { mealId } = useLocalSearchParams<{ mealId?: string }>();
  return <MealDetailsScreen mealId={mealId} />;
}
