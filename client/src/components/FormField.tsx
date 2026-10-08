import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

type Props = {
  variant?: 'onboarding' | 'meal';
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  hideLabel?: boolean;
};

export function FormField({ label, value, onChangeText, placeholder, error, secureTextEntry, keyboardType, autoCapitalize, hideLabel, variant = 'onboarding' }: Props) {
  return (
    <View style={styles.wrap}>
      {!hideLabel && <Text style={[styles.label, variant === 'meal' && styles.mealLabel]}>{label}</Text>}
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onboardingMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, variant === 'meal' && styles.mealInput, !!error && styles.errorInput]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  mealLabel: { fontFamily: fonts.poppinsSemiBold, fontSize: 10, textTransform: 'none', color: colors.homeText },
  mealInput: { minHeight: 46, paddingHorizontal: 12, borderRadius: 10, borderColor: colors.homeBorder, fontFamily: fonts.poppinsRegular, color: colors.homeText },
  wrap: { gap: 3, marginBottom: 8 },
  label: { color: colors.onboardingText, fontSize: 9, fontFamily: fonts.interExtraBold, textTransform: 'uppercase' },
  input: { minHeight: 40, borderWidth: 1, borderColor: colors.onboardingBorder, borderRadius: 8, backgroundColor: colors.surface, paddingHorizontal: 11, paddingVertical: 6, color: colors.onboardingText, fontSize: 10, fontFamily: fonts.interRegular },
  errorInput: { borderColor: colors.error },
  error: { color: colors.error, fontSize: 8, fontFamily: fonts.interMedium },
});
