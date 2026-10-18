// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; matched onboarding Figma typography and spacing
// This Code is generated with AI

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { UiAssetIcon, type UiAssetIconName } from './UiAssetIcon';
export function ReviewCard({
  title,
  value,
  onEdit,
  editLabel,
  icon = 'review-info',
  titleSize = 15,
}: {
  title: string;
  value: string;
  onEdit: () => void;
  editLabel: string;
  icon?: UiAssetIconName;
  titleSize?: number;
}) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.icon}><UiAssetIcon name={icon} /></View>
      <View style={styles.reviewCopy}>
        <Text style={[styles.reviewTitle, { fontSize: titleSize }]} numberOfLines={1}>{title}</Text>
        <Text style={styles.reviewValue} >{value}</Text>
      </View>
      <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={`${editLabel} ${title}`} style={styles.editButton}>
        <UiAssetIcon name="onboarding-edit" />
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
    paddingVertical: 8,
    minHeight: 42,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: { width: 27, height: 27, borderRadius: 14, backgroundColor: colors.homeSelected, alignItems: 'center', justifyContent: 'center' },
  reviewCopy: { flex: 1, gap: 2 },
  reviewTitle: {
    color: colors.onboardingText,
    fontSize: 15,
    fontFamily: fonts.poppinsSemiBold,
  },
  reviewValue: {
    color: colors.onboardingMuted,
    fontSize: 13,
    lineHeight: 16.25,
    fontFamily: fonts.interRegular,
  },
  editButton: { width: 20, height: 26, alignItems: 'center', justifyContent: 'center' },
});
