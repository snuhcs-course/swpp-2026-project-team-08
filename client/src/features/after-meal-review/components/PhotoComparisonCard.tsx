// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; fill photo frame height without vertical margins
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; revised manual after-meal flow
// This Code is generated with AI

import { HeightFitPhoto } from '../../../components/HeightFitPhoto';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MealPhoto } from '../../../types/meal';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export function PhotoComparisonCard({ before, after, beforeLabel, afterLabel, enlargeLabel, onEnlarge }: {
  before: MealPhoto;
  after: MealPhoto;
  beforeLabel: string;
  afterLabel: string;
  enlargeLabel: string;
  onEnlarge: (side: 'before' | 'after') => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {([{ photo: before, side: 'before', label: beforeLabel }, { photo: after, side: 'after', label: afterLabel }] as const).map((item) => (
          <Pressable key={item.side} accessibilityRole="button" accessibilityLabel={`${item.label}: ${enlargeLabel}`} onPress={() => onEnlarge(item.side)} style={styles.frame}>
            <HeightFitPhoto uri={item.photo.uri} height={228} />
            <Text style={styles.badge}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={() => onEnlarge('after')}>
        <View style={styles.enlargeRow}><UiAssetIcon name="meal-maximize" /><Text style={styles.enlarge}>{enlargeLabel}</Text></View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  frame: { flex: 1, height: 230, borderRadius: 14, borderWidth: 1, borderColor: colors.mealReviewBorder, overflow: 'hidden', backgroundColor: colors.homeBackground },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 8, left: 7, backgroundColor: colors.surface, color: colors.homeText, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, fontSize: 9, letterSpacing: 0.6, fontFamily: fonts.poppinsBold },
  enlargeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  enlarge: { color: colors.homePrimary, fontSize: 10, textAlign: 'center', fontFamily: fonts.interMedium },
});
