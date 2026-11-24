// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 홈 이동 카드를 HomeActionCard 공통 컴포넌트로 분리

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

export type HomeActionCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionIcon?: ReactNode;
  accessibilityLabel?: string;
  onPress: () => void;
};

export function HomeActionCard({
  title, description, actionLabel, actionIcon, accessibilityLabel, onPress,
}: HomeActionCardProps) {
  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${title} · ${description} · ${actionLabel}`}
      onPress={onPress} style={styles.reviewCard}>
      <View style={styles.mealCopy}>
        <Text style={styles.mealTitle}>{title}</Text>
        <Text style={styles.mealMeta}>{description}</Text>
      </View>
      <View style={styles.reviewAction}>
        <Text style={styles.reviewStatus}>{actionLabel}</Text>
        {actionIcon}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  reviewCard: { minHeight: 92, padding: 16, paddingBottom: 35, gap: 0, backgroundColor: colors.surface, borderRadius: 20, shadowColor: colors.homeShadow, shadowOffset: { width: 0, height: 6 }, shadowRadius: 22, shadowOpacity: 0.04, elevation: 1 },
  mealCopy: { gap: 3, paddingRight: 0 },
  mealTitle: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 16, lineHeight: 21.6 },
  mealMeta: { color: colors.homeMuted, fontFamily: fonts.poppinsRegular, fontSize: 11, lineHeight: 16.5 },
  reviewAction: { position: 'absolute', right: 22, bottom: 9, flexDirection: 'row', gap: 6, alignItems: 'center' },
  reviewStatus: { color: colors.homePrimary, fontFamily: fonts.poppinsBold, fontSize: 9, lineHeight: 13.5 },
});
