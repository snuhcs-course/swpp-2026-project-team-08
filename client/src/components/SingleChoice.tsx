// This Code is generated with AI

import { View } from 'react-native';
import { ChoiceRow } from './ChoiceRow';
export function SingleChoice({
  options,
  value,
  onChange,
}: {
  options: readonly { id: string; label: string; subtitle?: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View>
      {options.map((option) => (
        <ChoiceRow
          key={option.id}
          label={option.label}
          subtitle={option.subtitle}
          selected={value === option.id}
          onPress={() => onChange(option.id)}
        />
      ))}
    </View>
  );
}
