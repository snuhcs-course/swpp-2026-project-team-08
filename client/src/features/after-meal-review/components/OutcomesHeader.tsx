// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Outcome heading with back button, autosave and progress

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import type { Language } from '../../../types/profile';

export function OutcomesHeader({ language, caption, saveStatus, onBack, disabled }: {
  onBack: () => void;
  disabled?: boolean;
  language: Language;
  caption: string;
  saveStatus: 'saving' | 'saved' | 'error';
}) {
  const s = copyFor(language);
  return <View style={styles.root}>
    <View style={styles.topRow}>
      <View style={styles.navigation}>
        <Pressable accessibilityRole="button" accessibilityLabel={s.common.back}
          accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onBack} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.reviewHeading} />
        </Pressable>
        <Text style={styles.step}>{s.afterMealReview.reviewStep}</Text>
      </View>
      <View style={styles.save}>
        <Ionicons name={saveStatus === 'error' ? 'cloud-offline-outline' : 'cloud-done-outline'} size={13} color={saveStatus === 'error' ? colors.error : colors.success} />
        <Text accessibilityLiveRegion="polite" style={[styles.status, saveStatus === 'error' && styles.error]}>
          {saveStatus === 'saved' ? s.common.saved : saveStatus === 'saving' ? s.common.saving : s.afterMealReview.saveFailed}
        </Text>
      </View>
    </View>
    <Text accessibilityRole="header" style={styles.title}>{s.afterMealReview.titles.outcomes}</Text>
    <Text style={styles.caption}>{caption}</Text>
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 5, now: 1 }} style={styles.progress}>
      {[0, 1, 2, 3, 4].map(index => <View key={index} style={[styles.segment, index === 0 && styles.active]} />)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 18, gap: 12 },
  navigation: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', marginLeft: -12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  step: { color: colors.homePrimary, fontSize: 10, letterSpacing: 0.4, fontFamily: fonts.interBold },
  save: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  status: { color: colors.success, fontSize: 10, fontFamily: fonts.interBold, flexShrink: 1 },
  error: { color: colors.error },
  title: { fontSize: 25, lineHeight: 28, letterSpacing: -0.8, fontFamily: fonts.interBold, color: colors.reviewHeading, maxWidth: 310 },
  caption: { color: colors.reviewMuted, fontFamily: fonts.interRegular, fontSize: 11, lineHeight: 16 },
  progress: { flexDirection: 'row', gap: 5, marginTop: 6 },
  segment: { flex: 1, height: 4, borderRadius: 3, backgroundColor: colors.mealReviewBorder },
  active: { backgroundColor: colors.homePrimary },
});
