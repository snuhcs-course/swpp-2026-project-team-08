// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선

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
