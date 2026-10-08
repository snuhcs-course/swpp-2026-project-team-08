import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { recommendationText } from '../../../rules/recommendationPresentation';
import { usePersonalizedRecommendation } from '../hooks/usePersonalizedRecommendation';
import { RecommendationView } from './RecommendationView';

function RecommendationContent({ mealId }: { mealId: string }) {
  const { profile, language } = useProfile();
  const model = usePersonalizedRecommendation(profile!, mealId);
  const refresh = model.refresh;
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  if (model.loading) return (
    <SafeAreaView style={styles.center}><ActivityIndicator color={colors.homePrimary} /><Text>{copyFor(language).common.loading}</Text></SafeAreaView>
  );
  return <RecommendationView
    language={language}
    status={model.error ? 'error' : model.status}
    card={!model.error && model.current ? recommendationText(model.current, language, profile!) : null}
    mealFoods={model.meal?.foods ?? []}
    hasCandidates={model.hasCandidates}
    saving={model.saving}
    saveError={model.saveError}
    savedNotice={model.savedNotice}
    onBack={() => router.back()}
    onSave={() => { void model.saveCurrent(); }}
    onSkip={model.skip}
    onRetry={() => { void model.refresh(); }}
    onProfile={() => router.push('/(main)/profile')}
  />;
}

export function RecommendationScreen({ mealId }: { mealId: string }) {
  const model = useProfile();
  if (model.status === 'loading') return <SafeAreaView style={styles.center} />;
  if (model.status === 'error' || !model.profile) return <Redirect href="/" />;
  return <RecommendationContent mealId={mealId} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.homeBackground },
});
