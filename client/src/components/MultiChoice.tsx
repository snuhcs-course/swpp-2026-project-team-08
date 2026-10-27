// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { ChoiceRow } from './ChoiceRow';
import { FormField } from './FormField';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
type Option = { id: string; label: string };
type Labels = { all: string; add: string; remove: string; other: string; search: string; noMatches: string; otherHint: string };
type MultiProps = {
  options: Option[];
  catalogOptions?: Option[];
  labels: Labels;
  selected: string[];
  search: string;
  onSearchChange: (value: string) => void;
  showOther: boolean;
  onShowOtherChange: (value: boolean) => void;
  onToggle: (value: string) => void;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  onSetAll?: () => void;
  freeText?: boolean;
  noneLabel?: string;
  noneValue?: string;
  otherLabel?: string;
  optionSubtitles?: Record<string, string>;
  inlineSubtitleIds?: readonly string[];
};

export function MultiChoice({
  options,
  catalogOptions = [],
  labels,
  selected,
  search,
  onSearchChange,
  showOther,
  onShowOtherChange,
  onToggle,
  onAdd,
  onRemove,
  onSetAll,
  freeText,
  noneLabel,
  noneValue = 'none',
  otherLabel,
  optionSubtitles,
  inlineSubtitleIds,
}: MultiProps) {
  const baseOptions = options;
  const otherOptions = catalogOptions;
  const catalog = catalogOptions.length > 0;
  const custom = selected.filter(
    (item) =>
      item !== noneValue && !baseOptions.some((option) => option.id === item),
  );
  const results = otherOptions.filter(
    (option) =>
      !selected.includes(option.id) &&
      option.label
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );

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
      {baseOptions.map((option) => (
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
      {(!!catalog || freeText) && (
        <>
          <ChoiceRow
            label={otherLabel ?? labels.other}
            subtitle={optionSubtitles?.other}
            multiple
            selected={showOther}
            onPress={() => onShowOtherChange(!showOther)}
          />
          {showOther && (
            <View style={styles.searchPanel}>
              <Text style={styles.otherLabel}>{labels.other}</Text>
              <View style={styles.searchRow}>
                <View style={styles.searchField}>
                  <FormField
                    label={labels.search}
                    hideLabel
                    value={search}
                    onChangeText={onSearchChange}
                    placeholder={labels.search}
                  />
                </View>
                <AppButton
                  label={`+ ${labels.add}`}
                  compact
                  labelStyle={{ fontSize: 13 }}
                  disabled={!search.trim()}
                  onPress={() => onAdd(search)}
                  style={styles.addButton}
                />
              </View>
              {!!catalog &&
                !!search.trim() &&
                (results.length ? (
                  results.map((option) => (
                    <Pressable key={option.id} accessibilityRole="button" onPress={() => onAdd(option.id)} style={styles.catalogResult}>
                      <Text style={styles.catalogResultText}>{option.label}</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.hint}>{labels.noMatches}</Text>
                ))}
              {!search.trim() && <Text style={styles.otherHint}>{labels.otherHint}</Text>}
            </View>
          )}
        </>
      )}
      {custom.length > 0 && (
        <View style={styles.chipWrap}>
          {custom.map((value) => (
            <Pressable
              key={value}
              onPress={() => onRemove(value)}
              accessibilityRole="button"
              accessibilityLabel={`${labels.remove} ${catalogOptions.find((option) => option.id === value)?.label ?? value}`}
              style={styles.chip}
            >
              <Text style={styles.chipText}>
                {catalogOptions.find((option) => option.id === value)?.label ?? value} ×
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  catalogResult: { minHeight: 27, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.onboardingBorder, justifyContent: 'center' },
  catalogResultText: { color: colors.onboardingText, fontFamily: fonts.interRegular, fontSize: 9 },
  hint: {
    color: colors.onboardingMuted,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 4,
    fontFamily: fonts.interRegular,
  },
  allButton: { alignSelf: 'flex-end', marginBottom: 6 },
  otherLabel: {
    color: colors.onboardingText,
    fontSize: 14,
    fontFamily: fonts.poppinsSemiBold,
    textTransform: 'uppercase',
    marginTop: 2,
    marginBottom: 3,
  },
  searchPanel: { marginTop: 3 },
  searchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  searchField: { flex: 1 },
  addButton: { width: 72, minHeight: 40, borderRadius: 8 },
  otherHint: {
    color: colors.onboardingMuted,
    fontSize: 12,
    fontFamily: fonts.interRegular,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  chip: {
    borderRadius: 999,
    backgroundColor: colors.onboardingSelected,
    borderWidth: 1,
    borderColor: colors.onboardingPrimary,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: {
    color: colors.onboardingText,
    fontSize: 13,
    fontFamily: fonts.poppinsSemiBold,
  },
});
