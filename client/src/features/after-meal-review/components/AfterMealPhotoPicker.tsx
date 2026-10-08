import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PhotoSource } from '../../../types/meal';
import { AppIcon } from '../../../components/AppIcon';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export function AfterMealPhotoPicker({ labels, fileHint, picking, onPick }: {
  labels: Record<PhotoSource, string>;
  fileHint: string;
  picking: boolean;
  onPick: (source: PhotoSource) => void;
}) {
  return (
    <View style={styles.list}>
      {(['camera', 'gallery', 'files'] as const).map((source) => (
        <Pressable key={source} accessibilityRole="button" disabled={picking} onPress={() => onPick(source)} style={styles.row}>
          <View style={styles.icon}><AppIcon name={source} size={18} /></View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>{labels[source]}</Text>
            {source === 'files' && <Text style={styles.hint}>{fileHint}</Text>}
          </View>
          <AppIcon name="next" size={16} />
        </Pressable>
      ))}
      {picking && <ActivityIndicator color={colors.homePrimary} />}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 9 },
  row: { minHeight: 59, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderColor: colors.mealReviewBorder, borderWidth: 1, borderRadius: 13 },
  icon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.homeSelected },
  textWrap: { flex: 1 },
  label: { color: colors.homeText, fontFamily: fonts.interBold, fontSize: 11 },
  hint: { color: colors.mealReviewMuted, fontFamily: fonts.interRegular, fontSize: 8, marginTop: 3 },
});
