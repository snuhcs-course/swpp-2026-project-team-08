// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; corrected Figma audit details
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; matched onboarding Figma typography and spacing
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; corrected manual food editor geometry
// This Code is generated with AI

import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

type Props = {
  variant?: 'onboarding' | 'account' | 'safe' | 'safe-note' | 'meal' | 'editor';
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  hideLabel?: boolean;
  optionalLabel?: string;
};

export function FormField({ label, value, onChangeText, placeholder, error, secureTextEntry, keyboardType, autoCapitalize, hideLabel, optionalLabel, variant = 'onboarding' }: Props) {
  return (
    <View style={[styles.wrap, variant === 'editor' && styles.editorWrap, (variant === 'safe' || variant === 'safe-note') && { marginBottom: 0 }]}>
      {!hideLabel && 
        <View style={[styles.headingRow, variant === 'safe-note' && { justifyContent: 'flex-start', gap: 6 }]}>
          <Text style={[styles.label, (variant === 'account' || variant === 'safe-note') && { fontSize: 15, lineHeight: 22 }, variant === 'meal' && styles.mealLabel, variant === 'editor' && styles.editorLabel]}>
            {label}
            </Text>
            {optionalLabel && 
            <Text style={[styles.optionalLabel, variant === 'safe-note' && { fontSize: 12, fontFamily: fonts.interBold }]}>
              {optionalLabel}
            </Text>
            }
        </View>
      }
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={variant === 'editor' ? colors.editorPlaceholder : colors.onboardingMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, variant === 'meal' && styles.mealInput, variant === 'editor' && styles.editorInput, !!error && styles.errorInput]}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  mealLabel: { fontFamily: fonts.poppinsSemiBold, fontSize: 10, textTransform: 'none', color: colors.homeText },
  mealInput: { minHeight: 46, paddingHorizontal: 12, borderRadius: 10, borderColor: colors.homeBorder, fontFamily: fonts.poppinsRegular, color: colors.homeText },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, minHeight: 16 },
  optionalLabel: { color: colors.editorMuted, fontFamily: fonts.poppinsRegular, fontSize: 9, lineHeight: 16 },
  editorWrap: { gap: 6, marginBottom: 0 },
  editorLabel: { fontFamily: fonts.poppinsSemiBold, fontSize: 11, lineHeight: 16, textTransform: 'none', color: colors.editorMuted },
  editorInput: { minHeight: 38, height: 38, paddingHorizontal: 11, borderRadius: 10, borderColor: colors.mealReviewBorder, backgroundColor: colors.editorInput, fontFamily: fonts.poppinsMedium, fontSize: 13, color: colors.homeText },
  wrap: { gap: 5, marginBottom: 9 },
  label: { color: colors.onboardingText, fontSize: 15, lineHeight: 19, fontFamily: fonts.poppinsSemiBold },
  input: { minHeight: 40, borderWidth: 1, borderColor: colors.onboardingBorder, borderRadius: 8, backgroundColor: colors.surface, paddingHorizontal: 11, paddingVertical: 6, color: colors.onboardingText, fontSize: 14, fontFamily: fonts.interRegular },
  errorInput: { borderColor: colors.error },
  error: { color: colors.error, fontSize: 12, lineHeight: 16, fontFamily: fonts.interRegular },
});
