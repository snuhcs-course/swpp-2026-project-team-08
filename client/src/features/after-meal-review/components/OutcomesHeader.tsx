// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Outcome heading with back button, autosave and three-step progress; Use shared progress bar
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: Outcome 상단을 공통 헤더로 통일

import { AppHeader, topBarStyles } from '../../../components/AppHeader';
import { ProgressBar } from '../../../components/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
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
  return <View>
    <AppHeader title={s.afterMealReview.titles.outcomes} backLabel={s.common.back} onBack={onBack} disabled={disabled} />
    <View style={topBarStyles.details}>
    <View style={styles.topRow}>
      <Text style={styles.step}>{s.afterMealReview.reviewStep}</Text>
      <View style={styles.save}>
        <Ionicons name={saveStatus === 'error' ? 'cloud-offline-outline' : 'cloud-done-outline'} size={13} color={saveStatus === 'error' ? colors.error : colors.success} />
        <Text accessibilityLiveRegion="polite" style={[styles.status, saveStatus === 'error' && styles.error]}>
          {saveStatus === 'saved' ? s.common.saved : saveStatus === 'saving' ? s.common.saving : s.afterMealReview.saveFailed}
        </Text>
      </View>
    </View>
    <Text style={styles.caption}>{caption}</Text>
    <ProgressBar current={2} total={3} style={styles.progress}
      trackStyle={styles.segment} fillStyle={styles.active} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  step: { color: colors.homePrimary, fontSize: 10, letterSpacing: 0.4, fontFamily: fonts.interBold },
  save: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  status: { color: colors.success, fontSize: 10, fontFamily: fonts.interBold, flexShrink: 1 },
  error: { color: colors.error },
  caption: { color: colors.reviewMuted, fontFamily: fonts.interRegular, fontSize: 11, lineHeight: 16 },
  progress: { flexDirection: 'row', gap: 5, marginTop: 6 },
  segment: { flex: 1, height: 4, borderRadius: 3, backgroundColor: colors.mealReviewBorder },
  active: { backgroundColor: colors.homePrimary },
});
