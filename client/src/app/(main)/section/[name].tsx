// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { useLocalSearchParams } from 'expo-router';
import { SectionScreen } from '../../../features/home/screens/SectionScreen';
import { MealLogScreen } from '../../../features/meal-log/screens/MealLogScreen';

export default function SectionRoute() {
  const { name } = useLocalSearchParams<{ name: string }>();
  if (name === 'mealLog') return <MealLogScreen />;
  return <SectionScreen name={name} />;
}
