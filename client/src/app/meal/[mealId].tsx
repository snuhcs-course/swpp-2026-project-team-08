// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가

import { useLocalSearchParams } from 'expo-router';
import { MealDetailsScreen } from '../../features/meal-log/screens/MealDetailsScreen';

export default function MealDetailsRoute() {
  const { mealId } = useLocalSearchParams<{ mealId?: string }>();
  return <MealDetailsScreen mealId={mealId} />;
}
