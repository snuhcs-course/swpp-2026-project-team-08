// AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim

import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../util/colors';
import { calendarCells, densityLevel, isoDate, mealDateParts } from '../rules';
import { styles } from '../screens/mealLogStyles';

const densityFill = [colors.transparent, colors.logDensity1, colors.logDensity2, colors.logDensity3] as const;

export function MealLogCalendar({
  year,
  month,
  selectedDate,
  counts,
  weekdays,
  title,
  clearLabel,
  legend1,
  legend2,
  legend3,
  previousMonth,
  nextMonth,
  selectedDayLabel,
  logsOnDay,
  locale,
  onPrev,
  onNext,
  onToggleDay,
  onClear,
}: {
  year: number;
  month: number;
  selectedDate: string | null;
  counts: Record<string, number>;
  weekdays: string[];
  title: string;
  clearLabel: string;
  legend1: string;
  legend2: string;
  legend3: string;
  previousMonth: string;
  nextMonth: string;
  selectedDayLabel: (day: number) => string;
  logsOnDay: (day: number, count: number) => string;
  locale: string;
  onPrev: () => void;
  onNext: () => void;
  onToggleDay: (day: number) => void;
  onClear: () => void;
}) {
  const monthDate = new Date(year, month, 1);
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'short' }).format(monthDate);
  const selectedParts = selectedDate ? mealDateParts(selectedDate, locale) : null;
  return (
    <View style={styles.card}>
      <Text style={styles.calendarTitle}>{title}</Text>
      <View style={styles.toolbar}>
        <View style={styles.chipRow}>
          {selectedParts ? (
            <>
              <View
                accessible
                accessibilityLabel={selectedParts.monthDay}
                style={styles.dateChip}
              >
                <Feather name="calendar" size={14} color={colors.homePrimary} />
                <Text style={styles.dateChipText}>{selectedParts.monthDay}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={clearLabel} onPress={onClear}>
                <Text style={styles.clear}>{clearLabel}</Text>
              </Pressable>
            </>
          ) : null}
        </View>
        <View style={styles.legend}>
          {([{ color: colors.logDensity1, label: legend1 }, { color: colors.logDensity2, label: legend2 }, { color: colors.logDensity3, label: legend3 }]).map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.monthRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={previousMonth} onPress={onPrev} style={styles.nav}>
          <Feather name="chevron-left" size={16} color={colors.homeText} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthTitle}</Text>
        <Text style={styles.yearLabel}>{year}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={nextMonth} onPress={onNext} style={styles.nav}>
          <Feather name="chevron-right" size={16} color={colors.homeText} />
        </Pressable>
      </View>
      <View style={styles.weekRow}>
        {weekdays.map((label) => (
          <Text key={label} style={styles.weekLabel}>{label}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {calendarCells(year, month).map((day, index) => {
          if (day == null) return <View key={`empty-${index}`} style={styles.dayCell} />;
          const date = isoDate(year, month, day);
          const count = counts[date] ?? 0;
          const selected = selectedDate === date;
          const level = densityLevel(count);
          const fill = selected ? undefined : densityFill[level];
          const onDark = selected || level >= 2;
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={selected ? selectedDayLabel(day) : logsOnDay(day, count)}
              onPress={() => onToggleDay(day)}
              style={styles.dayCell}
            >
              <View style={[
                styles.day,
                fill && fill !== colors.transparent && { backgroundColor: fill },
                selected && styles.daySelected,
              ]}>
                <Text style={[styles.dayText, count === 0 && !selected && styles.dayMuted, onDark && styles.dayOnDark]}>{day}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
