// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
import { AppHeader, topBarStyles } from '../../../components/AppHeader';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export function ReviewProgressHeader({ title, backLabel, progress, onBack, optional, caption, hideProgress, disabled }: {
  title: string;
  backLabel: string;
  progress: number;
  onBack: () => void;
  optional?: string;
  caption?: string;
  stacked?: boolean;
  hideProgress?: boolean;
  disabled?: boolean;
}) {
  return (
    <View>
      <AppHeader title={title} backLabel={backLabel} onBack={onBack} disabled={disabled} accessory={optional ? <Text style={styles.optional}>{optional}</Text> : undefined} />
      <View style={topBarStyles.details}>
      {caption && <Text style={styles.caption}>{caption}</Text>}
      {!hideProgress && <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 5, now: progress + 1 }} style={styles.progress}>
        {[0, 1, 2, 3, 4].map((i) => <View key={i} style={[styles.segment, i <= progress && styles.active]} />)}
      </View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { color: colors.homeText, fontSize: 10, fontFamily: fonts.poppinsRegular, lineHeight: 14.5 },
  optional: { color: colors.mealReviewMuted, fontSize: 8, fontFamily: fonts.interRegular, marginLeft: 'auto' },
  progress: { flexDirection: 'row', gap: 5 },
  segment: { height: 4, flex: 1, borderRadius: 999, backgroundColor: colors.mealReviewBorder },
  active: { backgroundColor: colors.homePrimary },
});
