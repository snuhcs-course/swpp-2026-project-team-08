import { Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { UiAssetIcon, type UiAssetIconName } from './UiAssetIcon';
export function ReviewCard({
  title,
  value,
  onEdit,
  editLabel,
  icon = 'review-info',
}: {
  title: string;
  value: string;
  onEdit: () => void;
  editLabel: string;
  icon?: UiAssetIconName;
}) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.icon}><UiAssetIcon name={icon} /></View>
      <View style={styles.reviewCopy}>
        <Text style={styles.reviewTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.reviewValue} numberOfLines={2}>{value}</Text>
      </View>
      <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={`${editLabel} ${title}`} style={styles.editButton}>
        <Feather name="external-link" size={15} color={colors.onboardingMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.onboardingBorder,
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 42,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.homeSelected, alignItems: 'center', justifyContent: 'center' },
  reviewCopy: { flex: 1, gap: 2 },
  reviewTitle: {
    color: colors.onboardingText,
    fontSize: 9,
    fontFamily: fonts.interExtraBold,
  },
  reviewValue: {
    color: colors.onboardingMuted,
    fontSize: 8,
    lineHeight: 10,
    fontFamily: fonts.interRegular,
  },
  editButton: { width: 20, height: 26, alignItems: 'center', justifyContent: 'center' },
});
