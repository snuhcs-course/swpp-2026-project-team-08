// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Match after-meal photo source rows to the before-meal design
// AI-generated with GPT-6.2 Astra, 2026-11-22, reviewed by Haechan Jung
// Changed: 식전·식후 화면과 교체 시트의 사진 선택 목록 공유

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PhotoSource } from '../types/meal';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { AppIcon } from './AppIcon';
import { formStyles as ui } from './formStyles';

export function MealPhotoSourcePicker({ labels, fileHint, picking, inSheet, onPick }: {
  labels: Record<PhotoSource, string>;
  fileHint: string;
  picking: boolean;
  inSheet?: boolean;
  onPick: (source: PhotoSource) => void;
}) {
  return (
    <View style={inSheet ? styles.sheetList : styles.list}>
      {(['camera', 'gallery', 'files'] as const).map((source) => (
        <Pressable key={source} accessibilityRole="button" disabled={picking} onPress={() => onPick(source)} style={styles.row}>
          <View style={styles.icon}><AppIcon name={source} size={18} /></View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>{labels[source]}</Text>
            {source === 'files' && <Text style={ui.muted}>{fileHint}</Text>}
          </View>
          <AppIcon name="next" size={16} />
        </Pressable>
      ))}
      {picking && <ActivityIndicator color={colors.homePrimary} />}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  sheetList: { gap: 12 },
  row: { height: 60, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderColor: colors.mealReviewBorder, borderWidth: 1, borderRadius: 14 },
  icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.homeSelected },
  textWrap: { flex: 1 },
  label: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 12 },
});
