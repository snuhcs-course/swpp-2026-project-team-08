// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 식후 검토 글자 크기 및 가독성 개선
// AI-generated with GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 식전·식후 사진 나란히 확인·개별 확대와 식전 사진 없음 표시

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HeightFitPhoto } from '../../../components/HeightFitPhoto';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import type { MealPhoto } from '../../../types/meal';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

type Props = {
  before: MealPhoto | null;
  after: MealPhoto;
  beforeLabel: string;
  afterLabel: string;
  missingBeforeLabel: string;
  enlargeLabel: string;
  onEnlarge: (side: 'before' | 'after') => void;
  onAfterImageError: () => void;
};

export function PhotoComparisonCard({
  before, after, beforeLabel, afterLabel, missingBeforeLabel, enlargeLabel, onEnlarge, onAfterImageError,
}: Props) {
  const [failedBeforeUri, setFailedBeforeUri] = useState<string | null>(null);
  const tiles = [
    { side: 'before', photo: before?.uri === failedBeforeUri ? null : before, label: beforeLabel },
    { side: 'after', photo: after, label: afterLabel },
  ] as const;

  return (
    <View style={styles.row}>
      {tiles.map(({ side, photo, label }) => (
        <View key={side} style={styles.column}>
          <Text style={styles.label}>{label}</Text>
          {photo ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${enlargeLabel}`}
              onPress={() => onEnlarge(side)} style={styles.frame}>
              <HeightFitPhoto key={photo.id} uri={photo.uri} height={228}
                onError={side === 'before' ? () => setFailedBeforeUri(photo.uri) : onAfterImageError} />
              <View style={styles.enlarge}><UiAssetIcon name="meal-maximize" /></View>
            </Pressable>
          ) : (
            <View style={styles.frame}><Text style={styles.placeholder}>{missingBeforeLabel}</Text></View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  column: { flex: 1, minWidth: 0, gap: 6 },
  label: { color: colors.homeText, fontSize: 14, fontFamily: fonts.poppinsSemiBold },
  frame: { height: 230, justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.mealReviewBorder, overflow: 'hidden', backgroundColor: colors.homeBackground },
  enlarge: { position: 'absolute', right: 6, bottom: 6, padding: 4, borderRadius: 6, backgroundColor: colors.surface },
  placeholder: { paddingHorizontal: 8, textAlign: 'center', color: colors.mealReviewMuted, fontFamily: fonts.interRegular, fontSize: 14 },
});
