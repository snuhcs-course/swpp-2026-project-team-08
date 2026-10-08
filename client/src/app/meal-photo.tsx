import { useLocalSearchParams } from 'expo-router';
import { MealPhotoScreen } from '../features/meal-checkin/screens/MealPhotoScreen';

export default function MealPhotoRoute() {
  const { photoId } = useLocalSearchParams<{ photoId: string }>();
  return <MealPhotoScreen photoId={photoId} />;
}
