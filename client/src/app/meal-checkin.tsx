import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../features/onboarding/hooks/useOnboarding';
import { MealCheckinScreen } from '../features/meal-checkin/screens/MealCheckinScreen';
import { colors } from '../util/colors';
export default function MealCheckinEntry() {
  const model = useOnboarding();
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  if (!model.ready)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.homeBackground }}>
        <ActivityIndicator color={colors.homePrimary} />
      </SafeAreaView>
    );
  if (!model.profile) return <Redirect href="/" />;
  return (
    <MealCheckinScreen
      key={model.profile.id}
      childId={model.profile.id}
      language={model.language}
      onLanguage={() =>
        model.setLanguage(model.language === 'ko' ? 'en' : 'ko')
      }
      afterMealIntent={intent === 'after-meal'}
    />
  );
}
