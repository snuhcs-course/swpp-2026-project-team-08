import { Redirect, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ChildProfile } from '../../types/profile';
import { HomeView } from '../../features/home/components/HomeView';
import { useHome } from '../../features/home/hooks/useHome';
import { useOnboarding } from '../../features/onboarding/hooks/useOnboarding';
import { colors } from '../../util/colors';
import { copyFor } from '../../util/strings';

function HomeContent({ profile }: { profile: ChildProfile }) {
  const model = useOnboarding();
  const home = useHome(profile);
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
        language={model.language}
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
      />
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  const model = useOnboarding();
  if (!model.ready)
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.homePrimary} />
        <Text>{copyFor(model.language).common.loading}</Text>
      </SafeAreaView>
    );
  if (!model.profile) return <Redirect href="/" />;
  return <HomeContent profile={model.profile} />;
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
