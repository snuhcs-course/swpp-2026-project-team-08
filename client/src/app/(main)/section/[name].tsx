import { useLocalSearchParams } from 'expo-router';
import { SectionScreen } from '../../../features/home/screens/SectionScreen';
import { MealLogScreen } from '../../../features/meal-checkin/screens/MealLogScreen';

export default function SectionRoute() {
  const { name } = useLocalSearchParams<{ name: string }>();
  if (name === 'mealLog') return <MealLogScreen />;
  return <SectionScreen name={name} />;
}
