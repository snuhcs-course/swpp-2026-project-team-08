import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  multiple?: boolean;
  subtitle?: string;
  controlPosition?: 'leading' | 'trailing';
};

export function ChoiceRow({ label, selected, onPress, multiple, subtitle, controlPosition = 'trailing' }: Props) {
  const control = <View style={[styles.control, !multiple && styles.radio, selected && styles.controlSelected]}>
    {selected && <Text style={styles.check}>✓</Text>}
  </View>;
  return (
    <Pressable
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, selected && styles.selected, pressed && styles.pressed]}
    >
      {controlPosition === 'leading' && control}
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {controlPosition === 'trailing' && control}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 34, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: colors.onboardingBorder, borderRadius: 11, backgroundColor: colors.surface, marginBottom: 4 },
  selected: { backgroundColor: colors.onboardingSelected, borderColor: colors.onboardingPrimary },
  pressed: { opacity: 0.72 },
  control: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.onboardingBorder, alignItems: 'center', justifyContent: 'center' },
  radio: { borderRadius: 10 },
  controlSelected: { backgroundColor: colors.onboardingPrimary, borderColor: colors.onboardingPrimary },
  check: { color: colors.surface, fontSize: 11, fontFamily: fonts.interBold, lineHeight: 17 },
  copy: { flex: 1 },
  label: { color: colors.onboardingText, fontSize: 10, fontFamily: fonts.interMedium },
  subtitle: { color: colors.onboardingMuted, fontSize: 9, fontFamily: fonts.interRegular, marginTop: 2 },
});
