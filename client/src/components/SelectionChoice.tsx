// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선

import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formStyles as styles } from './formStyles';
import { UiAssetIcon } from './UiAssetIcon';
export function SelectionChoice({
  label,
  selected,
  onPress,
  icon,
  tile = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: ReactNode;
  tile?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, tile && styles.tile, selected && styles.selected]}
    >
      {icon && <View style={[styles.icon, tile && styles.tileIcon]}>{icon}</View>}
      <Text style={[styles.text, styles.choiceText, tile && styles.tileText]}>{label}</Text>
      <View style={[styles.radio, tile && styles.tileRadio, selected && styles.radioSelected]}>
        {selected && <UiAssetIcon name="meal-selection-check" />}
      </View>
    </Pressable>
  );
}
