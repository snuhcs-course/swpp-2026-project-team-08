import { Pressable, Text, View } from 'react-native';
import { AppButton } from './AppButton';
import { SelectionChoice } from './SelectionChoice';
import { AppIcon } from './AppIcon';
import { BottomSheet } from './BottomSheet';
import { formStyles as styles } from './formStyles';
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
  labels: { date: string; year: string; month: string; day: string; confirm: string; close: string };
  parts: [number, number, number];
  open: boolean;
  field: 0 | 1 | 2 | null;
  onToggle: () => void;
  onFieldChange: (field: 0 | 1 | 2 | null) => void;
  onNumberSelect: (number: number) => void;
  onConfirm: () => void;
}) {
  const [year, month] = parts;
  const dayCount = new Date(year, month, 0).getDate();
  return (
    <View style={styles.stack}>
      <Text style={styles.label}>{labels.date}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={[styles.choice, { justifyContent: 'space-between' }]}
      >
        <Text style={styles.text}>{label}</Text>
        <AppIcon name="down" size={14} />
      </Pressable>
      {open && (
        <View style={styles.card}>
          <View style={styles.row}>
            {([1, 2, 0] as const).map((index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={[labels.year, labels.month, labels.day][index]}
                onPress={() => onFieldChange(index)}
                style={[styles.choice, { flex: 1 }]}
              >
                <Text style={styles.text}>{parts[index]}</Text>
                <AppIcon name="down" size={14} />
              </Pressable>
            ))}
          </View>
          <AppButton
            variant="meal"
            label={labels.confirm}
            onPress={onConfirm}
          />
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
