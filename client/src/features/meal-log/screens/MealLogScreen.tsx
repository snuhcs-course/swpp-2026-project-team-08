// AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim

import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useMealLog } from '../hooks/useMealLog';
import { mealDateParts } from '../rules';
import { MealLogView } from './MealLogView';

export function MealLogScreen() {
  const profile = useProfile();
  const log = useMealLog(profile.profile?.id ?? '');
  const s = copyFor(profile.language);
  const locale = profile.language === 'ko' ? 'ko-KR' : 'en-US';
  const refresh = log.retry;
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  if (profile.status === 'loading') {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.homePrimary} />
        <Text>{s.common.loading}</Text>
      </SafeAreaView>
    );
  }
  if (profile.status === 'error' || !profile.profile) return <Redirect href="/" />;

  const fromLabel = log.selectedDate
    ? s.mealLog.fromDate(mealDateParts(log.selectedDate, locale).monthDay)
    : s.mealLog.fromAll;
  const draft = log.draft;
  return (
    <MealLogView
      language={profile.language}
      year={log.year}
      month={log.month}
      selectedDate={log.selectedDate}
      counts={log.counts}
      search={log.search}
      fromLabel={fromLabel}
      unreviewedOnly={log.unreviewedOnly}
      records={log.meals.map((meal) => {
        const parts = mealDateParts(meal.mealDate, locale);
        return {
          id: meal.id,
          title: s.mealLog.cardTitle(s.mealCheckin.types[meal.mealType], parts.monthDay, parts.weekday),
          foods: meal.foods.map((food) => food.name).join(', ') || s.common.empty,
          photoUri: meal.beforePhotoUri,
          awaiting: meal.reviewStatus === 'awaiting_review',
        };
      })}
      query={log.search}
      draftName={draft ? (draft.foods[0]?.name ?? s.mealLog.draft) : null}
      draftMeta={draft
        ? s.mealLog.draftMeta(
          mealDateParts(draft.mealDate, locale).monthDay,
          draft.mealType ? s.mealCheckin.types[draft.mealType] : s.mealLog.draft,
        )
        : null}
      loading={log.loading}
      error={log.error}
      refreshing={log.refreshing}
      onRefresh={() => { void log.retry(); }}
      onPrevMonth={() => log.goMonth(-1)}
      onNextMonth={() => log.goMonth(1)}
      onToggleDay={log.toggleDate}
      onClearDate={log.clearDate}
      onSearch={log.setSearch}
      onToggleUnreviewed={() => log.setUnreviewedOnly((value) => !value)}
      onContinueDraft={() => router.push('/meal-checkin')}
      onOpenMeal={(id) => router.push({ pathname: '/meal/[mealId]', params: { mealId: id } })}
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
