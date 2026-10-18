// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; corrected Figma audit details
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// This Code is generated with AI

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../../../components/AppIcon';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export function ReviewProgressHeader({ title, backLabel, progress, onBack, optional, caption, stacked, hideProgress, disabled }: {
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
    <View style={[styles.root, hideProgress && { paddingHorizontal: 18 }]}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel={backLabel} disabled={disabled} accessibilityState={{ disabled: !!disabled }} onPress={onBack} style={styles.back}>
          <AppIcon name="back" size={17} />
        </Pressable>
        {!stacked && <View style={{ flex: 1, gap: 2 }}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{caption && <Text style={styles.caption}>{caption}</Text>}</View>}
        {!!optional && <Text style={styles.optional}>{optional}</Text>}
      </View>
      {stacked && <Text accessibilityRole="header" style={[styles.title, { color: colors.reviewHeading, fontSize: 20, lineHeight: 23.6, fontFamily: fonts.poppinsBold }]}>{title}</Text>}
      {stacked && caption && <Text style={styles.caption}>{caption}</Text>}
      {!hideProgress && <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 5, now: progress + 1 }} style={styles.progress}>
        {[0, 1, 2, 3, 4].map((i) => <View key={i} style={[styles.segment, i <= progress && styles.active]} />)}
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { color: colors.homeText, fontSize: 10, fontFamily: fonts.poppinsRegular, lineHeight: 14.5 },
  root: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 14, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.mealReviewBorder },
  title: { color: colors.homeText, fontSize: 17, fontFamily: fonts.poppinsSemiBold, flexShrink: 1 },
  optional: { color: colors.mealReviewMuted, fontSize: 8, fontFamily: fonts.interRegular, marginLeft: 'auto' },
  progress: { flexDirection: 'row', gap: 5 },
  segment: { height: 4, flex: 1, borderRadius: 999, backgroundColor: colors.mealReviewBorder },
  active: { backgroundColor: colors.homePrimary },
});
