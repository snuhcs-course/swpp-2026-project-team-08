import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MealPhoto } from '../../../types/meal';
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
            <Image source={{ uri: item.photo.uri }} contentFit="cover" style={styles.image} />
            <Text style={styles.badge}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={() => onEnlarge('after')}>
        <Text style={styles.enlarge}>↗ {enlargeLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.mealReviewBorder, borderWidth: 1, borderRadius: 15, padding: 10, gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  frame: { flex: 1, height: 230, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.homeSelected },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 8, left: 7, backgroundColor: colors.surface, color: colors.homeText, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, fontSize: 8, fontFamily: fonts.interBold },
  enlarge: { color: colors.homePrimary, fontSize: 10, textAlign: 'center', fontFamily: fonts.interMedium },
});
