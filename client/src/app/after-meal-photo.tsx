import { useLocalSearchParams } from 'expo-router';
import { AfterMealPhotoScreen } from '../features/after-meal-review/screens/AfterMealPhotoScreen';

export default function AfterMealPhotoRoute() {
  const { mealId, side } = useLocalSearchParams<{ mealId: string; side?: string }>();
  return <AfterMealPhotoScreen mealId={mealId} side={side === 'before' ? 'before' : 'after'} />;
}
