// This Code is generated with AI

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
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, styles.choiceText, tile && styles.tileText]}>{label}</Text>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <UiAssetIcon name="meal-selection-check" />}
      </View>
    </Pressable>
  );
}
