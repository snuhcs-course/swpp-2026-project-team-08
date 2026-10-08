import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ChildProfile } from '../../../types/profile';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useHome } from '../hooks/useHome';
import { savedSuggestionText } from '../../../rules/recommendationPresentation';
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
        suggestionText={Object.fromEntries((home.data?.suggestions ?? []).map((item) => [
          item.id, savedSuggestionText(item, language, profile),
        ]))}
      />
    </SafeAreaView>
  );
}

export function HomeScreen() {
  const { status, profile, language } = useProfile();
  if (status === 'loading')
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.homePrimary} />
        <Text>{copyFor(language).common.loading}</Text>
      </SafeAreaView>
    );
  if (status === 'error' || !profile) return <Redirect href="/" />;
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
