import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import type { Language } from '../../../types/profile';
import { copyFor } from '../../../util/strings';
import { localDate } from '../../../util/date';
import { MealChoice, MealIcon, MealSheet, styles } from './MealControls';
export function MealDateField({
  value,
  language,
  onChange,
}: {
  value: string;
  language: Language;
  onChange: (date: string) => void;
}) {
  const s = copyFor(language);
  const [open, setOpen] = useState(false);
  const [parts, setParts] = useState(() => value.split('-').map(Number));
  const [field, setField] = useState<0 | 1 | 2 | null>(null);
  const [year, month, day] = parts;
  const dayCount = new Date(year, month, 0).getDate();
  const date = new Date(
    ...([
      Number(value.slice(0, 4)),
      Number(value.slice(5, 7)) - 1,
      Number(value.slice(8, 10)),
    ] as [number, number, number]),
  );
  const label = s.mealCheckin.dateLabel(
    date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-GB', {
      month: 'long',
      day: 'numeric',
      ...(localDate() !== value ? { year: 'numeric' } : {}),
    }),
    localDate() === value,
  );
  return (
    <View style={styles.stack}>
      <Text style={styles.label}>{s.mealCheckin.date}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          setParts(value.split('-').map(Number));
          setOpen(!open);
        }}
        style={[styles.choice, { justifyContent: 'space-between' }]}
      >
        <Text style={styles.text}>{label}</Text>
        <MealIcon name="down" size={14} />
      </Pressable>
      {open && (
        <View style={styles.card}>
          <View style={styles.row}>
            {([1, 2, 0] as const).map((index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={
                  [s.mealCheckin.year, s.mealCheckin.month, s.mealCheckin.day][
                    index
                  ]
                }
                onPress={() => setField(index)}
                style={[styles.choice, { flex: 1 }]}
              >
                <Text style={styles.text}>{parts[index]}</Text>
                <MealIcon name="down" size={14} />
              </Pressable>
            ))}
          </View>
          <AppButton
            variant="meal"
            label={s.mealCheckin.confirmDate}
            onPress={() => {
              onChange(
                localDate(new Date(year, month - 1, Math.min(day, dayCount))),
              );
              setOpen(false);
            }}
          />
        </View>
      )}
      {field !== null && (
        <MealSheet
          title={
            [s.mealCheckin.year, s.mealCheckin.month, s.mealCheckin.day][field]
          }
          closeLabel={s.common.close}
          onClose={() => setField(null)}
        >
          {Array.from(
            { length: field === 0 ? 301 : field === 1 ? 12 : dayCount },
            (_, i) => (field === 0 ? 1900 + i : i + 1),
          ).map((number) => (
            <MealChoice
              key={number}
              label={String(number)}
              selected={parts[field] === number}
              onPress={() => {
                const next = [...parts];
                next[field] = number;
                next[2] = Math.min(
                  next[2],
                  new Date(next[0], next[1], 0).getDate(),
                );
                setParts(next);
                setField(null);
              }}
            />
          ))}
        </MealSheet>
      )}
    </View>
  );
}
