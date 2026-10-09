// This Code is generated with AI

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { SuggestionCard } from '../../../components/SuggestionCard';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';

type Props = {
  language: Language;
  status: 'ready' | 'safety-unverified' | 'no-safe-candidate' | 'meal-changed' | 'insufficient-evidence' | 'missing-record' | 'error';
  card: { title: string; description: string; servingTip: string } | null;
  mealFoods: { name: string; ingredients: string[]; preparation: string; servingNote: string }[];
  hasCandidates: boolean;
  saving: boolean;
  saveError: boolean;
  savedNotice: boolean;
  onBack: () => void;
  onSave: () => void;
  onSkip: () => void;
  onRetry: () => void;
  onProfile: () => void;
};

export function RecommendationView(p: Props) {
  const [showMeal, setShowMeal] = useState(false);
  const s = copyFor(p.language);
  const m = s.recommendation;
  const reason = p.status === 'safety-unverified' ? m.safetyUnverified
    : p.status === 'no-safe-candidate' ? m.noSafeCandidate
      : p.status === 'meal-changed' ? m.mealChanged
      : p.status === 'insufficient-evidence' ? m.insufficientEvidence
        : p.status === 'missing-record' ? m.missingRecord
          : p.status === 'error' ? m.loadFailed : m.allDone;
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{m.title}</Text>
        <Text style={styles.intro}>{m.intro}</Text>
        {p.card ? (
          <>
            <SuggestionCard
              badge={m.source}
              title={p.card.title}
              description={p.card.description}
              servingTip={p.card.servingTip}
              labels={{ whatToTry: m.whatToTry, whyEasier: m.whyEasier, servingTip: m.servingTip,
                noServingTip: m.servingTip, tried: m.save, notTried: m.skip }}
              onTried={p.onSave}
              onNotTried={p.onSkip}
              disabled={p.saving}
            />
            <Text style={styles.safety}>{m.safety}</Text>
            {p.savedNotice && <Text style={styles.success}>{m.saved}</Text>}
            {p.saving && <Text accessibilityLiveRegion="polite" style={styles.message}>{m.saving}</Text>}
            {p.saveError && (
              <View style={styles.actions}>
                <Text accessibilityRole="alert" style={styles.error}>{m.saveFailed}</Text>
                <AppButton variant="meal" label={m.retry} onPress={p.onSave} />
              </View>
            )}
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.message}>{reason}</Text>
            {p.savedNotice && <Text style={styles.success}>{m.saved}</Text>}
            {p.status === 'safety-unverified' && <AppButton variant="meal" secondary label={m.checkProfile} onPress={p.onProfile} />}
            {(p.status === 'no-safe-candidate' || p.status === 'meal-changed' || p.status === 'missing-record') && (
              <AppButton variant="meal" secondary label={m.checkMeal} onPress={() => setShowMeal((value) => !value)} />
            )}
            {showMeal && p.mealFoods.map((food, index) => (
              <View key={`${food.name}:${index}`} style={styles.foodInfo}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.message}>{s.mealCheckin.ingredients}: {food.ingredients.join(', ') || s.common.notEntered}</Text>
                <Text style={styles.message}>{s.mealCheckin.preparation}: {food.preparation || s.common.notEntered}</Text>
                <Text style={styles.message}>{s.mealCheckin.servingNote}: {food.servingNote || s.common.notEntered}</Text>
              </View>
            ))}
            {p.status === 'error' && <AppButton variant="meal" secondary label={m.retryLoad} onPress={p.onRetry} />}
          </View>
        )}
        {p.hasCandidates && !p.card && <Text style={styles.safety}>{m.safety}</Text>}
        <AppButton variant="meal" secondary label={m.goBack} onPress={p.onBack} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  content: { padding: 18, gap: 12, flexGrow: 1 },
  title: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 22 },
  intro: { color: colors.mealReviewMuted, fontFamily: fonts.interRegular, fontSize: 11, lineHeight: 17 },
  safety: { color: colors.mealReviewMuted, fontFamily: fonts.interRegular, fontSize: 10, lineHeight: 16 },
  message: { color: colors.homeText, fontFamily: fonts.interRegular, fontSize: 12, lineHeight: 18 },
  error: { color: colors.error, fontFamily: fonts.interMedium, fontSize: 11 },
  success: { color: colors.success, fontFamily: fonts.interMedium, fontSize: 11 },
  empty: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.mealReviewBorder, borderRadius: 16, padding: 18, gap: 14 },
  actions: { gap: 8 },
  foodInfo: { borderTopWidth: 1, borderTopColor: colors.mealReviewBorder, paddingTop: 10, gap: 5 },
  foodName: { color: colors.homeText, fontFamily: fonts.interBold, fontSize: 12 },
});
