// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; replace date bottom sheets with anchored scroll pickers

import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { AppIcon } from './AppIcon';
import { formStyles as styles } from './formStyles';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
export function DateField({
  label,
  labels,
  parts,
  open,
  field,
  onToggle,
  onFieldChange,
  onNumberSelect,
  onConfirm,
}: {
  label: string;
  labels: { date: string; year: string; month: string; day: string; confirm: string; close: string; select: string; hint: string; locale: string };
  parts: [number, number, number];
  open: boolean;
  field: 0 | 1 | 2 | null;
  onToggle: () => void;
  onFieldChange: (field: 0 | 1 | 2 | null) => void;
  onNumberSelect: (number: number) => void;
  onConfirm: () => void;
}) {
  const pickerRef = useRef<ScrollView>(null);
  const [year, month, day] = parts;
  const dayCount = new Date(year, month, 0).getDate();
  const displayDate = new Date(year, month - 1, day).toLocaleDateString(labels.locale, { day: 'numeric', month: 'long', year: 'numeric' });
  const optionCount = (index: 0 | 1 | 2) => index === 0 ? 301 : index === 1 ? 12 : dayCount;
  const pickerOffset = (index: 0 | 1 | 2) => Math.max(0, Math.min(parts[index] - (index === 0 ? 1900 : 1) - 2, optionCount(index) - 5)) * 36;
  return (
    <View style={dateStyles.wrap}>
      <Text style={styles.label}>{labels.date}</Text>
      {!open && <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={[styles.choice, dateStyles.field]}
      >
        <Text style={styles.text}>{label}</Text>
        <AppIcon name="down" size={14} />
      </Pressable>}
      {open && (
        <View style={dateStyles.card}>
          <Text style={dateStyles.cardTitle}>{labels.select}</Text>
          <Text style={dateStyles.displayDate}>{displayDate}</Text>
          <View style={dateStyles.fields}>
            {([1, 2, 0] as const).map((index) => (
              <View key={index} style={[dateStyles.partWrap, field === index && dateStyles.openPart]}>
                <Text style={dateStyles.fieldLabel}>{[labels.year, labels.month, labels.day][index]}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={[labels.year, labels.month, labels.day][index]} accessibilityState={{ expanded: field === index }} onPress={() => onFieldChange(field === index ? null : index)} style={dateStyles.partField}>
                  <Text style={dateStyles.partText}>{index === 1 ? new Date(year, month - 1, 1).toLocaleDateString(labels.locale, { month: 'short' }) : index === 2 ? String(day).padStart(2, '0') : year}</Text>
                  <AppIcon name="down" size={14} />
                </Pressable>
                {field === index && <View style={dateStyles.picker}>
                  <ScrollView
                    key={`${index}-${year}-${month}`}
                    ref={pickerRef}
                    onContentSizeChange={() => pickerRef.current?.scrollTo({ x: 0, y: pickerOffset(index), animated: false })}
                    nestedScrollEnabled
                    style={dateStyles.pickerScroll}
                    contentOffset={{ x: 0, y: pickerOffset(index) }}
                    accessibilityLabel={[labels.year, labels.month, labels.day][index]}
                  >
                    {Array.from({ length: optionCount(index) }, (_, i) => index === 0 ? 1900 + i : i + 1).map((number) => (
                      <Pressable key={number} accessibilityRole="button" accessibilityState={{ selected: parts[index] === number }} onPress={() => onNumberSelect(number)} style={[dateStyles.option, parts[index] === number && dateStyles.selectedOption]}>
                        <Text style={[dateStyles.partText, parts[index] === number && dateStyles.selectedText]}>{index === 1 ? new Date(year, number - 1, 1).toLocaleDateString(labels.locale, { month: 'short' }) : number}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>}
              </View>
            ))}
          </View>
          <Text style={dateStyles.hint}>{labels.hint}</Text>
          <AppButton variant="meal" label={labels.confirm} style={dateStyles.confirm} onPress={onConfirm} />
        </View>
      )}

    </View>
  );
}

const dateStyles = StyleSheet.create({
  wrap: { gap: 5, zIndex: 20 },
  field: { justifyContent: 'space-between', backgroundColor: colors.surface },
  card: { borderWidth: 1, borderColor: colors.homeBorder, borderRadius: 10, backgroundColor: colors.surface, padding: 11, gap: 8 },
  cardTitle: { color: colors.homeText, fontSize: 13, fontFamily: fonts.poppinsSemiBold },
  displayDate: { color: colors.homeText, fontSize: 11, fontFamily: fonts.poppinsRegular },
  fields: { flexDirection: 'row', gap: 8, zIndex: 20 },
  partWrap: { flex: 1, gap: 5, position: 'relative' },
  openPart: { zIndex: 30 },
  picker: { position: 'absolute', top: 65, left: 0, right: 0, maxHeight: 180, borderRadius: 10, borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.surface, overflow: 'hidden', elevation: 8, shadowColor: colors.navy, shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  pickerScroll: { maxHeight: 180 },
  option: { height: 36, paddingHorizontal: 10, justifyContent: 'center' },
  selectedOption: { backgroundColor: colors.homeSelected },
  selectedText: { color: colors.homePrimary, fontFamily: fonts.poppinsSemiBold },
  fieldLabel: { color: colors.homeText, fontSize: 10, fontFamily: fonts.poppinsSemiBold },
  partField: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.homeBackground, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  partText: { color: colors.homeText, fontSize: 13, fontFamily: fonts.poppinsRegular },
  hint: { color: colors.homeMuted, fontSize: 10, fontFamily: fonts.poppinsRegular },
  confirm: { minHeight: 32, borderRadius: 8 },
});
