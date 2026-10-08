import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ label, onPress, disabled, secondary, compact, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base, compact && styles.compact, secondary ? styles.secondary : styles.primary,
        disabled && styles.disabled, pressed && !disabled && styles.pressed, style,
      ]}
    >
      <Text style={[styles.label, secondary && styles.secondaryLabel, disabled && styles.disabledLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
