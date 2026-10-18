// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import { Redirect, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useMealDetails } from '../hooks/useMealDetails';
import { mealDateParts } from '../rules';
import { MealDetailsView } from './MealDetailsView';

export function MealDetailsScreen({ mealId }: { mealId?: string }) {
  const profile = useProfile();
  const details = useMealDetails(profile.profile?.id ?? '', mealId ?? '', profile.profile?.updatedAt ?? '');
  const s = copyFor(profile.language);
  const locale = profile.language === 'ko' ? 'ko-KR' : 'en-US';

  if (profile.status === 'loading') {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.homePrimary} />
        <Text>{s.common.loading}</Text>
      </SafeAreaView>
    );
  }
  if (profile.status === 'error' || !profile.profile) return <Redirect href="/" />;

  const meal = details.meal;
  const parts = meal ? mealDateParts(meal.mealDate, locale) : null;
  const mealType = meal ? s.mealCheckin.types[meal.mealType] : '';
  const deleteLine = meal && parts ? `${parts.monthDay} (${parts.weekday}) · ${mealType}` : '';
  const heading = meal && parts
    ? s.mealLog.heading(
      parts.monthDay,
      parts.weekday,
      mealType,
      s.mealCheckin.settings[meal.setting],
    )
    : '';

  return (
    <MealDetailsView
      language={profile.language}
      heading={heading}
      deleteLine={deleteLine}
      beforeUri={meal?.beforePhotoUri ?? null}
      afterUri={meal?.review?.afterPhotoUri ?? null}
      awaitingReview={!!meal && !meal.review}
      cards={details.cards}
      savedSuggestionIds={details.savedSuggestionIds}
      loading={details.loading}
      error={details.error || (!details.loading && !meal)}
      deleting={details.deleting}
      deleteError={details.deleteError}
      suggestionSaveError={details.saveError}
      savingSuggestion={details.savingSuggestion}
      onBack={() => router.back()}
      onContinueReview={() => router.push({ pathname: '/after-meal-photo', params: { mealId: mealId ?? '' } })}
      onToggleSaved={details.toggleSaved}
      onRetry={() => { void details.retry(); }}
      onDelete={() => {
        void details.deleteMeal().then(() => {
          router.replace({ pathname: '/section/[name]', params: { name: 'mealLog' } });
        }).catch(() => undefined);
      }}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.homeBackground,
  },
});
