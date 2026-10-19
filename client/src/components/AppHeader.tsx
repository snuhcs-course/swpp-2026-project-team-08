// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { AppIcon } from './AppIcon';

export const topBarLayout = { height: 56, inset: 24, bodyGap: 8, backSize: 36 } as const;

export function AppHeader({ title, backLabel, onBack, disabled, accessory }: {
  title?: string;
  backLabel?: string;
  onBack?: () => void;
  disabled?: boolean;
  accessory?: ReactNode;
}) {
  return <View testID="app-header" style={styles.row}>
    {onBack && backLabel && <Pressable testID="app-header-back" accessibilityRole="button" accessibilityLabel={backLabel}
      accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onBack} style={styles.back}>
      <AppIcon name="back" size={18} />
    </Pressable>}
    <View style={styles.copy}>{title && <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>{title}</Text>}</View>
    {accessory && <View style={styles.accessory}>{accessory}</View>}
  </View>;
}
export const topBarStyles = StyleSheet.create({
  content: { paddingHorizontal: topBarLayout.inset, paddingTop: topBarLayout.bodyGap },
  details: { paddingHorizontal: topBarLayout.inset, paddingBottom: topBarLayout.bodyGap, gap: 8, flexShrink: 0 },
});
const styles = StyleSheet.create({
  row: { height: topBarLayout.height, flexShrink: 0, paddingHorizontal: topBarLayout.inset, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.homeBackground },
  back: { width: topBarLayout.backSize, height: topBarLayout.backSize, borderRadius: topBarLayout.backSize / 2, backgroundColor: colors.surface, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.poppinsSemiBold, fontSize: 17, lineHeight: 26, color: colors.homeText, textAlign: 'left' },
  accessory: { flexShrink: 0 },
});
