// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
import { AppHeader, topBarStyles } from '../../../components/AppHeader';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../../providers/ProfileProvider';
import type { ChildProfile } from '../../../types/profile';
import { savedSuggestionText } from '../../../rules/recommendationPresentation';
import { SuggestionCard } from '../../../components/SuggestionCard';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useSuggestion } from '../hooks/useSuggestion';

function SuggestionContent({ profile, id, mealId }: { profile: ChildProfile; id: string; mealId?: string }) {
  const model = useProfile();
  const suggestion = useSuggestion(profile, id, mealId);
  const s = copyFor(model.language);
  const item = suggestion.item;
  const card = item
    ? savedSuggestionText(item, model.language, profile)
    : suggestion.linked
      ? {
        title: suggestion.linked.title,
        description: suggestion.linked.description,
        servingTip: suggestion.linked.servingTip ?? s.afterMealReview.noServingTip,
      }
      : null;
  return <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <AppHeader title={s.afterMealReview.savedSuggestion} backLabel={s.common.back} onBack={() => router.back()} />
    <ScrollView contentContainerStyle={styles.content}>
    {suggestion.loading && <ActivityIndicator color={colors.homePrimary} />}
    {suggestion.error && <Text style={styles.description}>{s.home.refreshFailed}</Text>}
    {suggestion.ready && !item && !suggestion.linked && <Text style={styles.description}>{s.common.empty}</Text>}
    {card && <>
      <SuggestionCard
        badge={s.afterMealReview.savedSuggestion}
        title={card.title}
        description={card.description}
        servingTip={card.servingTip}
        labels={s.afterMealReview}
      />
      {item?.recommendation && <Text style={styles.description}>{s.recommendation.safety}</Text>}
    </>}
    </ScrollView>
  </SafeAreaView>;
}

export function SuggestionScreen({ id, mealId }: { id: string; mealId?: string }) {
  const model = useProfile();
  if (model.status === 'loading') return <SafeAreaView style={styles.root} />;
  if (model.status === 'error' || !model.profile) return <Redirect href="/" />;
  return <SuggestionContent profile={model.profile} id={id} mealId={mealId} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  content: { ...topBarStyles.content, paddingBottom: 24, gap: 20 },
  description: { color: colors.homeMuted, fontSize: 14, lineHeight: 21 },
});
