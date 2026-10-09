// This Code is generated with AI

import Feather from '@expo/vector-icons/Feather';
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
  const control = <View style={[styles.control, selected && styles.controlSelected]}>
    {selected && <Feather name="check" size={12} color={colors.surface} />}
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
        <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {controlPosition === 'trailing' && control}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 34, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: colors.onboardingBorder, borderRadius: 11, backgroundColor: colors.surface, marginBottom: 5 },
  selected: { backgroundColor: colors.onboardingChoiceSelected, borderColor: colors.onboardingPrimary, borderWidth: 1.4 },
  pressed: { opacity: 0.72 },
  control: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.onboardingBorder, alignItems: 'center', justifyContent: 'center' },
  controlSelected: { backgroundColor: colors.onboardingPrimary, borderColor: colors.onboardingPrimary },
  copy: { flex: 1 },
  label: { color: colors.onboardingText, fontSize: 10, lineHeight: 12, fontFamily: fonts.interMedium },
  selectedLabel: { color: colors.onboardingPrimary },
  subtitle: { color: colors.onboardingMuted, fontSize: 8, lineHeight: 10, fontFamily: fonts.interRegular, marginTop: 1 },
});
