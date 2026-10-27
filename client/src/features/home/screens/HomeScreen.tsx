// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선

import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ChildProfile } from '../../../types/profile';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useHome } from '../hooks/useHome';
import { HomeView } from './HomeView';

function HomeContent({ profile }: { profile: ChildProfile }) {
  const { language } = useProfile();
  const home = useHome(profile);
  const refresh = home.refresh;
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <HomeView
        draft={home.draft}
        pendingMeals={home.pendingMeals}
        meals={home.storedMeals}
        onReviewMeal={(mealId) => router.push({ pathname: '/after-meal-review', params: { mealId } })}
        onSavedSuggestions={() => router.push({ pathname: '/section/[name]', params: { name: 'ideas' } })}
        onMealHistory={(date) => router.push({ pathname: '/section/[name]', params: { name: 'mealLog', ...(date ? { date } : {}) } })}
        draftLoading={home.draftLoading}
        draftError={home.draftError}
        onReviewDraft={() =>
          router.push({
            pathname: '/meal-checkin',
            params: { intent: 'after-meal' },
          })
        }
        profile={profile}
        language={language}
        now={home.now}
        data={home.data}
        loading={home.loading}
        error={home.error}
        refreshing={home.refreshing}
        onRefresh={() => {
          void home.refresh();
        }}
        onLogMeal={() =>
          router.push({
            pathname: '/meal-checkin',
            params: { startAfterMealId: home.lastSavedMealId },
          })
        }
        onTrySuggestion={(id) =>
          router.push({ pathname: '/suggestion/[id]', params: { id } })
        }
        suggestionText={Object.fromEntries(home.data.suggestions.map((item) => [
          item.id, { title: item.title, description: item.description },
        ]))}
      />
    </SafeAreaView>
  );
}

export function HomeScreen() {
  const auth = useAuth();
  const { status, profile, language } = useProfile();
  if (auth.status === 'loading' || status === 'loading')
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.homePrimary} />
        <Text>{copyFor(language).common.loading}</Text>
      </SafeAreaView>
    );
  if (!auth.session || status === 'error' || !profile) return <Redirect href="/" />;
  return <HomeContent profile={profile} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.homeBackground,
  },
});
