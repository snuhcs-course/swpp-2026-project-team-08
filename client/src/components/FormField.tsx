import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

type Props = {
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

export function FormField({ label, value, onChangeText, placeholder, error, secureTextEntry, keyboardType, autoCapitalize, hideLabel }: Props) {
  return (
    <View style={styles.wrap}>
      {!hideLabel && <Text style={styles.label}>{label}</Text>}
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onboardingMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, !!error && styles.errorInput]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 3, marginBottom: 8 },
  label: { color: colors.onboardingText, fontSize: 9, fontFamily: fonts.interExtraBold, textTransform: 'uppercase' },
  input: { minHeight: 40, borderWidth: 1, borderColor: colors.onboardingBorder, borderRadius: 8, backgroundColor: colors.surface, paddingHorizontal: 11, paddingVertical: 6, color: colors.onboardingText, fontSize: 10, fontFamily: fonts.interRegular },
  errorInput: { borderColor: colors.error },
  error: { color: colors.error, fontSize: 8, fontFamily: fonts.interMedium },
});
