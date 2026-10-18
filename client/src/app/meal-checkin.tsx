// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import { Redirect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../providers/ProfileProvider';
import { MealCheckinScreen } from '../features/meal-checkin/screens/MealCheckinScreen';
import { colors } from '../util/colors';
export default function MealCheckinEntry() {
  const model = useProfile();
  const { intent, startAfterMealId, tryingSuggestionId } = useLocalSearchParams<{
    intent?: string;
    tryingSuggestionId?: string;
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
      tryingSuggestionId={tryingSuggestionId}
      language={model.language}
      onLanguage={() => model.changeLanguage(model.language === 'ko' ? 'en' : 'ko')}
      afterMealIntent={intent === 'after-meal'}
    />
  );
}
