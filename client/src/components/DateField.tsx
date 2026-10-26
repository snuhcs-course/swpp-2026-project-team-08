// AI-generated with GPT-6, 2026-10-26, reviewed by Seoyeon Heo
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { AppButton } from './AppButton';
import { AppIcon } from './AppIcon';
import { formStyles as styles } from './formStyles';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

type Part = 0 | 1 | 2;
type Parts = [number, number, number];
type Labels = { date: string; year: string; month: string; day: string; confirm: string; close: string; select: string; hint: string; locale: string };
type FieldSize = { height?: number; fontSize?: number; borderRadius?: number };
type SizingProps = { size?: FieldSize };
type FullDateProps = SizingProps & {
  variant?: 'date';
  label: string;
  labels: Labels;
  parts: Parts;
  open: boolean;
  field: Part | null;
  onToggle: () => void;
  onFieldChange: (field: Part | null) => void;
  onNumberSelect: (number: number) => void;
  onConfirm: () => void;
};
type MonthYearProps = SizingProps & {
  variant: 'month-year';
  year: number;
  /** Calendar months use 1–12 here; adapt zero-based Date months at the call site. */
  month: number;
  labels: Pick<Labels, 'year' | 'month' | 'locale'>;
  onChange: (year: number, month: number) => void;
};

export function DateField(props: FullDateProps | MonthYearProps) {
  return props.variant === 'month-year' ? <MonthYearField {...props} /> : <FullDateField {...props} />;
}

function DateParts({ parts, labels, visibleParts, field, onFieldChange, onSelect, showLabels = false, size }: SizingProps & {
  parts: Parts;
  labels: Pick<Labels, 'year' | 'month' | 'locale'> & { day?: string };
  visibleParts: readonly Part[];
  field: Part | null;
  onFieldChange: (field: Part | null) => void;
  onSelect: (part: Part, number: number) => void;
  showLabels?: boolean;
}) {
  const [year, month] = parts;
  return <View style={dateStyles.fields}>
    {visibleParts.map(index => <DatePart key={index} index={index} value={parts[index]}
      year={year} month={month} label={[labels.year, labels.month, labels.day ?? ''][index]}
      locale={labels.locale} open={field === index} showLabel={showLabels} size={size}
      onToggle={() => onFieldChange(field === index ? null : index)} onSelect={number => onSelect(index, number)} />)}
  </View>;
}

function DatePart({ index, value, year, month, label, locale, open, showLabel, onToggle, onSelect, size }: SizingProps & {
  index: Part; value: number; year: number; month: number; label: string; locale: string;
  open: boolean; showLabel: boolean; onToggle: () => void; onSelect: (number: number) => void;
}) {
  const pickerRef = useRef<ScrollViewInstance>(null);
  const inputSize = { height: size?.height ?? 44, borderRadius: size?.borderRadius ?? 10 };
  const textSize = { fontSize: size?.fontSize ?? 13 };
  const count = index === 0 ? 301 : index === 1 ? 12 : new Date(year, month, 0).getDate();
  const first = index === 0 ? 1900 : 1;
  const offset = Math.max(0, Math.min(value - first - 2, count - 5)) * 36;
  const format = (number: number) => index === 1
    ? new Date(year, number - 1, 1).toLocaleDateString(locale, { month: 'short' })
    : index === 2 ? String(number).padStart(2, '0') : String(number);
  return <View style={[dateStyles.partWrap, open && dateStyles.openPart]}>
    {showLabel && <Text style={dateStyles.fieldLabel}>{label}</Text>}
    <Pressable testID={`date-part-${index}`} accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ expanded: open }} onPress={onToggle} style={[dateStyles.partField, inputSize]}>
      <Text style={[dateStyles.partText, textSize]}>{format(value)}</Text>
      <AppIcon name="down" size={14} />
    </Pressable>
    {open && <View testID={`date-options-${index}`} style={[dateStyles.picker, { borderRadius: inputSize.borderRadius }]}>
      <ScrollView key={`${index}-${year}-${month}`} ref={pickerRef}
        onContentSizeChange={() => pickerRef.current?.scrollTo({ x: 0, y: offset, animated: false })}
        nestedScrollEnabled keyboardShouldPersistTaps="handled" style={dateStyles.pickerScroll}
        contentOffset={{ x: 0, y: offset }} accessibilityLabel={label}>
        {Array.from({ length: count }, (_, i) => first + i).map(number =>
          <Pressable key={number} accessibilityRole="button" accessibilityState={{ selected: value === number }}
            onPress={() => onSelect(number)} style={[dateStyles.option, value === number && dateStyles.selectedOption]}>
            <Text style={[dateStyles.partText, textSize, value === number && dateStyles.selectedText]}>{format(number)}</Text>
          </Pressable>)}
      </ScrollView>
    </View>}
  </View>;
}

function MonthYearField({ year, month, labels, onChange, size }: MonthYearProps) {
  const [field, setField] = useState<Part | null>(null);
  return <View style={[dateStyles.wrap, dateStyles.monthYear]}>
    <DateParts parts={[year, month, 1]} labels={labels} visibleParts={[1, 0]} size={size}
      field={field} onFieldChange={setField} onSelect={(part, number) => {
        setField(null);
        onChange(part === 0 ? number : year, part === 1 ? number : month);
      }} />
  </View>;
}

function FullDateField({ label, labels, parts, open, field, onToggle, onFieldChange, onNumberSelect, onConfirm, size }: FullDateProps) {
  const [year, month, day] = parts;
  const displayDate = new Date(year, month - 1, day).toLocaleDateString(labels.locale, { day: 'numeric', month: 'long', year: 'numeric' });
  return <View style={dateStyles.wrap}>
    <Text style={styles.label}>{labels.date}</Text>
    {!open && <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={[styles.choice, dateStyles.field,
      size?.height !== undefined && { height: size.height, minHeight: size.height, paddingVertical: 0 },
      size?.borderRadius !== undefined && { borderRadius: size.borderRadius }]}>
      <Text style={[styles.text, size?.fontSize !== undefined && { fontSize: size.fontSize, lineHeight: Math.ceil(size.fontSize * 1.5) }]}>{label}</Text><AppIcon name="down" size={14} />
    </Pressable>}
    {open && <View style={dateStyles.card}>
      <Text style={dateStyles.cardTitle}>{labels.select}</Text>
      <Text style={dateStyles.displayDate}>{displayDate}</Text>
      <DateParts parts={parts} labels={labels} visibleParts={[1, 2, 0]} showLabels size={size}
        field={field} onFieldChange={onFieldChange} onSelect={(_, number) => onNumberSelect(number)} />
      <Text style={dateStyles.hint}>{labels.hint}</Text>
      <AppButton variant="meal" label={labels.confirm} style={dateStyles.confirm} onPress={onConfirm} />
    </View>}
  </View>;
}

const dateStyles = StyleSheet.create({
  wrap: { gap: 5, zIndex: 20 },
  field: { justifyContent: 'space-between', backgroundColor: colors.surface },
  card: { borderWidth: 1, borderColor: colors.homeBorder, borderRadius: 10, backgroundColor: colors.surface, padding: 11, gap: 8 },
  cardTitle: { color: colors.homeText, fontSize: 13, fontFamily: fonts.poppinsSemiBold },
  displayDate: { color: colors.homeText, fontSize: 11, fontFamily: fonts.poppinsRegular },
  fields: { flexDirection: 'row', gap: 8, zIndex: 20 },
  monthYear: { flex: 1 },
  partWrap: { flex: 1, gap: 5, position: 'relative' },
  openPart: { zIndex: 30 },
  picker: { position: 'absolute', top: '100%', marginTop: 4, left: 0, right: 0, maxHeight: 180, borderRadius: 10, borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.surface, overflow: 'hidden', elevation: 8, shadowColor: colors.navy, shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
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
