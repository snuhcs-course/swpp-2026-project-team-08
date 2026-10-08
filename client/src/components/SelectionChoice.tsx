import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formStyles as styles } from './formStyles';
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
      <Text style={[styles.text, styles.choiceText]}>{label}</Text>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.dot} />}
      </View>
    </Pressable>
  );
}
