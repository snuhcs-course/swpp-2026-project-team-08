// This Code is generated with AI

import { useLocalSearchParams } from 'expo-router';
import { SuggestionScreen } from '../../features/home/screens/SuggestionScreen';

export default function SuggestionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SuggestionScreen id={id} />;
}
