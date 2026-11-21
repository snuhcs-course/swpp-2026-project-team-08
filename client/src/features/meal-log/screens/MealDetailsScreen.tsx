// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 식사 기록 화면 디자인 개선

// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 식사 상세 추천 진입과 중복 이동 방지

// AI-generated with GPT-6, 2026-11-17, reviewed by Haechan Jung
// Changed: 식사 상세에서 장소 미응답 표시

import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
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
  const details = useMealDetails(profile.profile?.id ?? '', mealId ?? '');
  const openingSuggestion = useRef(false);
  useFocusEffect(useCallback(() => {
    openingSuggestion.current = false;
  }, []));
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
      meal.setting ? s.mealCheckin.settings[meal.setting] : s.common.notEntered,
    )
    : '';

  return (
    <MealDetailsView
      language={profile.language}
      heading={heading}
      deleteLine={deleteLine}
      beforeUri={meal?.beforePhotoUri ?? null}
      afterUri={meal?.afterPhotoUri ?? null}
      awaitingReview={!!meal && !meal.review}
      cards={details.cards}
      canViewSuggestions={details.canViewSuggestions}
      suggestionsLoading={details.suggestionsLoading}
      suggestionsError={details.suggestionsError}
      onViewSuggestions={() => {
        if (!meal || !details.canViewSuggestions || details.deleting || openingSuggestion.current) return;
        openingSuggestion.current = true;
        // 추천 화면도 상세로 replace하여 돌아오므로 상세를 스택에 중복으로 남기지 않는다.
        router.replace({ pathname: '/recommendation/[mealId]', params: { mealId: meal.id } });
      }}
      loading={details.loading}
      error={details.error || (!details.loading && !meal)}
      deleting={details.deleting}
      deleteError={details.deleteError}
      onBack={() => router.back()}
      onContinueReview={() => router.push({ pathname: '/after-meal-review', params: { mealId: mealId ?? '' } })}
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
