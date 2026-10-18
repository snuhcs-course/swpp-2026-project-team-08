// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// This Code is generated with AI

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../../../components/AppIcon';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export function ReviewProgressHeader({ title, backLabel, progress, onBack, optional, caption, stacked }: {
  title: string;
  backLabel: string;
  progress: number;
  onBack: () => void;
  optional?: string;
  caption?: string;
  stacked?: boolean;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} style={styles.back}>
          <AppIcon name="back" size={17} />
        </Pressable>
        {!stacked && <Text accessibilityRole="header" style={styles.title}>{title}</Text>}
        {!!optional && <Text style={styles.optional}>{optional}</Text>}
      </View>
      {stacked && <Text accessibilityRole="header" style={[styles.title, { fontSize: 20, lineHeight: 24 }]}>{title}</Text>}
      {caption && <Text style={styles.caption}>{caption}</Text>}
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 5, now: progress + 1 }} style={styles.progress}>
        {[0, 1, 2, 3, 4].map((i) => <View key={i} style={[styles.segment, i <= progress && styles.active]} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { color: colors.homeText, fontSize: 10, fontFamily: fonts.interRegular },
  root: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 11, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  title: { color: colors.homeText, fontSize: 16, fontFamily: fonts.poppinsSemiBold, flex: 1 },
  optional: { color: colors.mealReviewMuted, fontSize: 13, fontFamily: fonts.interRegular, marginLeft: 'auto' },
  progress: { flexDirection: 'row', gap: 5 },
  segment: { height: 3, flex: 1, borderRadius: 999, backgroundColor: colors.mealReviewBorder },
  active: { backgroundColor: colors.homePrimary },
});
