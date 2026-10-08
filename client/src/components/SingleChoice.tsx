import { View } from 'react-native';
import { ChoiceRow } from './ChoiceRow';
import type { Language } from '../types/profile';
import { optionsFor, type OptionGroup } from '../util/strings';
export function SingleChoice({
  language,
  group,
  value,
  onChange,
}: {
  language: Language;
  group: OptionGroup;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View>
      {optionsFor(group, language).map((option) => (
        <ChoiceRow
          key={option.id}
          label={option.label}
          selected={value === option.id}
          onPress={() => onChange(option.id)}
        />
      ))}
    </View>
  );
}
