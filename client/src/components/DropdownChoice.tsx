// This Code is generated with AI

import { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

export function DropdownChoice({ options, value, onChange, placeholder, displayFallback }: {
  options: readonly { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  displayFallback?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);
  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={[styles.field, open && styles.activeField]}>
        <Text style={styles.value}>{selected?.label ?? displayFallback ?? placeholder}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={15} color={colors.onboardingText} />
      </Pressable>
      {open && <View style={styles.options}>
        {options.map((option) => (
          <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: value === option.id }} onPress={() => { onChange(option.id); setOpen(false); }} style={[styles.option, value === option.id && styles.selectedOption]}>
            <Text style={[styles.optionText, value === option.id && styles.selectedText]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 5 },
  field: { height: 40, borderRadius: 8, borderWidth: 1, borderColor: colors.onboardingBorder, backgroundColor: colors.surface, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeField: { borderColor: colors.onboardingPrimary, borderWidth: 1.4 },
  value: { flex: 1, color: colors.onboardingText, fontSize: 10, fontFamily: fonts.interMedium },
  options: { borderRadius: 8, borderWidth: 1, borderColor: colors.onboardingBorder, backgroundColor: colors.surface, overflow: 'hidden' },
  option: { height: 36, paddingHorizontal: 11, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.onboardingBorder },
  selectedOption: { backgroundColor: colors.homeSelected },
  optionText: { color: colors.onboardingText, fontSize: 10, fontFamily: fonts.interRegular },
  selectedText: { color: colors.onboardingPrimary, fontFamily: fonts.interBold },
});
