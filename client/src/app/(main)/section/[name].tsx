// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useLocalSearchParams } from 'expo-router';
import { SectionScreen } from '../../../features/home/screens/SectionScreen';
import { MealLogScreen } from '../../../features/meal-log/screens/MealLogScreen';

import { SavedSuggestionsScreen } from '../../../features/suggestions/screens/SavedSuggestionsScreen';

export default function SectionRoute() {
  const { name } = useLocalSearchParams<{ name: string }>();
  if (name === 'ideas') return <SavedSuggestionsScreen />;
  if (name === 'mealLog') return <MealLogScreen />;
  return <SectionScreen name={name} />;
}
