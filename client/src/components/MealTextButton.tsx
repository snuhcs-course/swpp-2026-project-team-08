// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 초안 저장·건너뛰기 등 식사 흐름 보조 버튼 공통화

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

export function MealTextButton({ label, onPress, disabled, icon, labelStyle }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  labelStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
    >
      {icon}
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 12, alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  label: { color: colors.homePrimary, fontSize: 16, fontFamily: fonts.poppinsSemiBold, textAlign: 'center', flexShrink: 1 },
});
