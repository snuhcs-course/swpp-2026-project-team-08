import { useLocalSearchParams } from 'expo-router';
import { SectionScreen } from '../../../features/home/screens/SectionScreen';

export default function SectionRoute() {
  const { name } = useLocalSearchParams<{ name: string }>();
  return <SectionScreen name={name} />;
}
