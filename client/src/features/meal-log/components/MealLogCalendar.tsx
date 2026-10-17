// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../../../util/colors';
import { calendarCells, densityLevel, mealDateParts } from '../rules';
import { styles } from '../screens/mealLogStyles';

const densityFill = [colors.transparent, colors.logDensity1, colors.logDensity2, colors.logDensity3] as const;
const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

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
  selectedDateLabel,
  noneYet,
  locale,
  onPrev,
  onNext,
  onToggleDate,
  onClear,
  onMonthYear,
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
  selectedDateLabel: string;
  noneYet: string;
  locale: string;
  onPrev: () => void;
  onNext: () => void;
  onToggleDate: (date: string) => void;
  onClear: () => void;
  onMonthYear: (year: number, month: number) => void;
}) {
  const monthDate = new Date(year, month, 1);
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'short' }).format(monthDate);
  const selectedParts = selectedDate ? mealDateParts(selectedDate, locale) : null;
  const [picker, setPicker] = useState<'month' | 'year' | null>(null);
  const years = Array.from({ length: 8 }, (_, index) => year - 4 + index);

  return (
    <View style={styles.calendarBlock}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.selectedRow}>
        <View style={styles.selectedLeft}>
          <View style={styles.selectedTitle}>
            <Feather name="calendar" size={14} color={colors.homeText} />
            <Text style={styles.selectedTitleText}>{selectedDateLabel}</Text>
          </View>
          <View style={styles.selectedValueRow}>
            {selectedParts ? (
              <>
                <Text style={styles.selectedValue}>{selectedParts.monthDay}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={clearLabel} onPress={onClear} hitSlop={8}>
                  <Feather name="rotate-ccw" size={14} color={colors.homePrimary} />
                </Pressable>
              </>
            ) : (
              <Text style={styles.noneYet}>{noneYet}</Text>
            )}
          </View>
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
      <View style={styles.card}>
        <View style={styles.monthRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={previousMonth} onPress={onPrev} style={styles.nav}>
            <Feather name="chevron-left" size={16} color={colors.homeText} />
          </Pressable>
          <View style={styles.monthPickers}>
            <Pressable accessibilityRole="button" onPress={() => setPicker('month')} style={styles.picker}>
              <Text style={styles.pickerLabel}>{monthTitle}</Text>
              <Feather name="chevron-down" size={14} color={colors.homeMuted} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setPicker('year')} style={styles.picker}>
              <Text style={styles.pickerLabel}>{String(year)}</Text>
              <Feather name="chevron-down" size={14} color={colors.homeMuted} />
            </Pressable>
          </View>
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
          {calendarCells(year, month).map((cell) => {
            const count = cell.inMonth ? (counts[cell.date] ?? 0) : 0;
            const selected = selectedDate === cell.date;
            const level = densityLevel(count);
            const fill = densityFill[level];
            const onDark = selected || level >= 2;
            return (
              <Pressable
                key={cell.date}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={selected ? selectedDayLabel(cell.day) : logsOnDay(cell.day, count)}
                onPress={() => onToggleDate(cell.date)}
                style={styles.dayCell}
              >
                <View style={[
                  styles.day,
                  fill !== colors.transparent && { backgroundColor: fill },
                  selected && styles.daySelected,
                ]}>
                  <Text style={[
                    styles.dayText,
                    (!cell.inMonth || (count === 0 && !selected)) && styles.dayMuted,
                    onDark && cell.inMonth && styles.dayOnDark,
                  ]}>{cell.day}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Modal transparent animationType="fade" visible={picker != null} onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.pickerSheet} onPress={() => setPicker(null)}>
          <Pressable style={styles.pickerCard} onPress={() => undefined}>
            <ScrollView>
              {(picker === 'month' ? months : years).map((value) => {
                const active = picker === 'month' ? value === month : value === year;
                const label = picker === 'month'
                  ? new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, value, 1))
                  : String(value);
                return (
                  <Pressable
                    key={String(value)}
                    onPress={() => {
                      if (picker === 'month') onMonthYear(year, value);
                      else onMonthYear(value, month);
                      setPicker(null);
                    }}
                    style={styles.pickerOption}
                  >
                    <Text style={[styles.pickerOptionText, active && styles.pickerOptionOn]}>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
