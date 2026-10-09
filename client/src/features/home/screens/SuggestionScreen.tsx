// This Code is generated with AI

import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfile } from '../../../providers/ProfileProvider';
import type { ChildProfile } from '../../../types/profile';
import { savedSuggestionText } from '../../../rules/recommendationPresentation';
import { SuggestionCard } from '../../../components/SuggestionCard';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useSuggestion } from '../hooks/useSuggestion';

function SuggestionContent({ profile, id }: { profile: ChildProfile; id: string }) {
  const model = useProfile();
  const suggestion = useSuggestion(profile, id);
  const s = copyFor(model.language);
  const item = suggestion.item;
  const card = item ? savedSuggestionText(item, model.language, profile) : null;
  return <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
    <Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={styles.back}>← {s.common.back}</Text></Pressable>
    {suggestion.loading && <ActivityIndicator color={colors.homePrimary} />}
    {suggestion.error && <Text style={styles.description}>{s.home.refreshFailed}</Text>}
    {suggestion.ready && !item && <Text style={styles.description}>{s.common.empty}</Text>}
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
  </SafeAreaView>;
}

export function SuggestionScreen({ id }: { id: string }) {
  const model = useProfile();
  if (model.status === 'loading') return <SafeAreaView style={styles.root} />;
  if (model.status === 'error' || !model.profile) return <Redirect href="/" />;
  return <SuggestionContent profile={model.profile} id={id} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, backgroundColor: colors.homeBackground, gap: 20 },
  back: { color: colors.homePrimary, fontSize: 14, fontWeight: '700' },
  description: { color: colors.homeMuted, fontSize: 14, lineHeight: 21 },
});
