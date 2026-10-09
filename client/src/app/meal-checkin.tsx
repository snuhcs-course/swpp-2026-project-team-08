// This Code is generated with AI

import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../providers/ProfileProvider';
import { MealCheckinScreen } from '../features/meal-checkin/screens/MealCheckinScreen';
import { colors } from '../util/colors';
export default function MealCheckinEntry() {
  const model = useProfile();
  const { intent, startAfterMealId } = useLocalSearchParams<{
    intent?: string;
    startAfterMealId?: string;
  }>();
  if (model.status === 'loading')
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.homeBackground }}>
        <ActivityIndicator color={colors.homePrimary} />
      </SafeAreaView>
    );
  if (model.status === 'error' || !model.profile) return <Redirect href="/" />;
  return (
    <MealCheckinScreen
      key={model.profile.id}
      childId={model.profile.id}
      startAfterMealId={startAfterMealId}
      language={model.language}
      onLanguage={() => model.changeLanguage(model.language === 'ko' ? 'en' : 'ko')}
      afterMealIntent={intent === 'after-meal'}
    />
  );
}
