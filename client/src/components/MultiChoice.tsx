// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 카탈로그 검색·직접 입력 제거, 고정 선택지만 다중 선택

import { StyleSheet, View } from 'react-native';
import { AppButton } from './AppButton';
import { ChoiceRow } from './ChoiceRow';
type Option = { id: string; label: string };
type Labels = { all: string };
type MultiProps = {
  options: Option[];
  labels: Labels;
  selected: string[];
  onToggle: (value: string) => void;
  onSetAll?: () => void;
  noneLabel?: string;
  noneValue?: string;
  optionSubtitles?: Record<string, string>;
  inlineSubtitleIds?: readonly string[];
};

export function MultiChoice({
  options,
  labels,
  selected,
  onToggle,
  onSetAll,
  noneLabel,
  noneValue = 'none',
  optionSubtitles,
  inlineSubtitleIds,
}: MultiProps) {
  return (
    <View>
      {!!onSetAll && (
        <AppButton
          label={labels.all}
          compact
          secondary
          style={styles.allButton}
          onPress={onSetAll}
        />
      )}
      {!!noneLabel && (
        <ChoiceRow
          label={noneLabel}
          subtitle={optionSubtitles?.none}
          multiple
          selected={selected.includes(noneValue)}
          onPress={() => onToggle(noneValue)}
        />
      )}
      {options.map((option) => (
        <ChoiceRow
          key={option.id}
          label={option.label}
          subtitle={optionSubtitles?.[option.id]}
          inlineSubtitle={inlineSubtitleIds?.includes(option.id)}
          multiple
          selected={selected.includes(option.id)}
          onPress={() => onToggle(option.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  allButton: { alignSelf: 'flex-end', marginBottom: 6 },
});
