import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { SelectionChoice } from './SelectionChoice';
import { AppIcon } from './AppIcon';
import { BottomSheet } from './BottomSheet';
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
  const [year, month, day] = parts;
  const dayCount = new Date(year, month, 0).getDate();
  const displayDate = new Date(year, month - 1, day).toLocaleDateString(labels.locale, { day: 'numeric', month: 'long', year: 'numeric' });
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
              <View key={index} style={{ flex: 1, gap: 5 }}>
                <Text style={dateStyles.fieldLabel}>{[labels.year, labels.month, labels.day][index]}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={[labels.year, labels.month, labels.day][index]} onPress={() => onFieldChange(index)} style={dateStyles.partField}>
                  <Text style={dateStyles.partText}>{index === 1 ? new Date(year, month - 1, 1).toLocaleDateString(labels.locale, { month: 'short' }) : index === 2 ? String(day).padStart(2, '0') : year}</Text>
                  <AppIcon name="down" size={14} />
                </Pressable>
              </View>
            ))}
          </View>
          <Text style={dateStyles.hint}>{labels.hint}</Text>
          <AppButton variant="meal" label={labels.confirm} style={dateStyles.confirm} onPress={onConfirm} />
        </View>
      )}
      {field !== null && (
        <BottomSheet
          title={[labels.year, labels.month, labels.day][field]}
          closeLabel={labels.close}
          onClose={() => onFieldChange(null)}
        >
          {Array.from(
            { length: field === 0 ? 301 : field === 1 ? 12 : dayCount },
            (_, i) => (field === 0 ? 1900 + i : i + 1),
          ).map((number) => (
            <SelectionChoice
              key={number}
              label={String(number)}
              selected={parts[field] === number}
              onPress={() => onNumberSelect(number)}
            />
          ))}
        </BottomSheet>
      )}
    </View>
  );
}

const dateStyles = StyleSheet.create({
  wrap: { gap: 5 },
  field: { justifyContent: 'space-between', backgroundColor: colors.surface },
  card: { borderWidth: 1, borderColor: colors.homeBorder, borderRadius: 10, backgroundColor: colors.surface, padding: 11, gap: 8 },
  cardTitle: { color: colors.homeText, fontSize: 13, fontFamily: fonts.poppinsSemiBold },
  displayDate: { color: colors.homeText, fontSize: 11, fontFamily: fonts.poppinsRegular },
  fields: { flexDirection: 'row', gap: 8 },
  fieldLabel: { color: colors.homeText, fontSize: 10, fontFamily: fonts.poppinsSemiBold },
  partField: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.homeBorder, backgroundColor: colors.homeBackground, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  partText: { color: colors.homeText, fontSize: 13, fontFamily: fonts.poppinsRegular },
  hint: { color: colors.homeMuted, fontSize: 10, fontFamily: fonts.poppinsRegular },
  confirm: { minHeight: 32, borderRadius: 8 },
});
