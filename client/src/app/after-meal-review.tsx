// This Code is generated with AI

import { useLocalSearchParams } from 'expo-router';
import { AfterMealReviewScreen } from '../features/after-meal-review/screens/AfterMealReviewScreen';

export default function AfterMealReviewRoute() {
  const { mealId } = useLocalSearchParams<{ mealId?: string }>();
  return <AfterMealReviewScreen mealId={mealId} />;
}
