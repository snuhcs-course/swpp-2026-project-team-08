import { useLocalSearchParams } from 'expo-router';
import { OnboardingScreen } from '../../features/onboarding/screens/OnboardingScreen';

export default function OnboardingRoute() {
  const { step, from } = useLocalSearchParams<{ step: string; from?: string }>();
  return <OnboardingScreen routeStep={step} from={from} />;
}
