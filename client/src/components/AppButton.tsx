import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

type Props = {
  variant?: 'onboarding' | 'meal';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ label, onPress, disabled, secondary, compact, style, variant = 'onboarding' }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base, compact && styles.compact, secondary ? styles.secondary : styles.primary,
        variant === 'meal' && styles.meal, variant === 'meal' && !secondary && styles.mealPrimary,
        disabled && styles.disabled, pressed && !disabled && styles.pressed, style,
      ]}
    >
      <Text style={[styles.label, variant === 'meal' && styles.mealLabel, secondary && styles.secondaryLabel, disabled && styles.disabledLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  meal: { minHeight: 52, paddingHorizontal: 16, borderRadius: 14, borderColor: colors.homeBorder },
  mealPrimary: { backgroundColor: colors.homePrimary },
  mealLabel: { fontSize: 14, fontFamily: fonts.poppinsSemiBold },
  base: { minHeight: 46, borderRadius: 11, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  compact: { minHeight: 34 },
  primary: { backgroundColor: colors.onboardingPrimary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.onboardingBorder },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  label: { color: colors.surface, fontSize: 11, fontFamily: fonts.interBold, textAlign: 'center' },
  secondaryLabel: { color: colors.onboardingText },
  disabledLabel: { opacity: 0.9 },
});
