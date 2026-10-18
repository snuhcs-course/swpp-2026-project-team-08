// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; aligned ABC button typography
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

type Props = {
  variant?: 'onboarding' | 'meal' | 'suggestion';
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  compact?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export function AppButton({ label, accessibilityLabel, onPress, disabled, secondary, compact, icon, style, labelStyle, variant = 'onboarding' }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base, compact && styles.compact, secondary ? styles.secondary : styles.primary,
        variant === 'meal' && styles.meal, variant === 'meal' && !secondary && styles.mealPrimary,
        variant === 'suggestion' && styles.suggestion,
        variant === 'suggestion' && (secondary ? styles.suggestionSecondary : styles.mealPrimary),
        disabled && styles.disabled, pressed && !disabled && styles.pressed, style,
        variant === 'suggestion' && disabled && styles.suggestionDisabled,
      ]}
    >
      {icon}
      <Text style={[styles.label, variant === 'meal' && styles.mealLabel, secondary && styles.secondaryLabel, disabled && styles.disabledLabel, variant === 'suggestion' && styles.suggestionLabel, variant === 'suggestion' && secondary && styles.suggestionSecondaryLabel, variant === 'suggestion' && disabled && styles.suggestionDisabledLabel, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  suggestion: { minHeight: 48, borderRadius: 14, paddingHorizontal: 16 },
  suggestionSecondary: { borderColor: colors.homeBorder, backgroundColor: colors.surface, borderWidth: 1 },
  suggestionLabel: { fontFamily: fonts.poppinsSemiBold, fontSize: 16, lineHeight: 21, color: colors.surface },
  suggestionSecondaryLabel: { color: colors.homeText },
  suggestionDisabled: { opacity: 1, backgroundColor: colors.homeBorder },
  suggestionDisabledLabel: { opacity: 1, color: colors.suggestionMuted },
  meal: { minHeight: 52, paddingHorizontal: 16, borderRadius: 14, borderColor: colors.homeBorder },
  mealPrimary: { backgroundColor: colors.homePrimary },
  mealLabel: { fontSize: 14, fontFamily: fonts.poppinsSemiBold },
  base: { minHeight: 46, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  compact: { minHeight: 34 },
  primary: { backgroundColor: colors.onboardingPrimary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.onboardingBorder },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  label: { color: colors.surface, fontSize: 13, fontFamily: fonts.interMedium, textAlign: 'center' },
  secondaryLabel: { color: colors.onboardingText, fontSize: 11, fontFamily: fonts.interBold },
  disabledLabel: { opacity: 0.9 },
});
