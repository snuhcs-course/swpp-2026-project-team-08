// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; reset meal list navigation state for a home-selected date
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { useLocalSearchParams } from 'expo-router';
import { SectionScreen } from '../../../features/home/screens/SectionScreen';
import { MealLogScreen } from '../../../features/meal-log/screens/MealLogScreen';

import { SavedSuggestionsScreen } from '../../../features/suggestions/screens/SavedSuggestionsScreen';

export default function SectionRoute() {
  const { name, date } = useLocalSearchParams<{ name: string; date?: string }>();
  if (name === 'ideas') return <SavedSuggestionsScreen />;
  if (name === 'mealLog') return <MealLogScreen key={date ?? 'all'} />;
  return <SectionScreen name={name} />;
}
