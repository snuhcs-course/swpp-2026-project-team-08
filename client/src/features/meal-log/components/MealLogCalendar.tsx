// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 식사 기록 화면 디자인 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화

import { DateField } from '../../../components/DateField';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../../../util/colors';
import { calendarCells, densityLevel, mealDateParts } from '../rules';
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
  selectedDateLabel,
  noneYet,
  locale,
  monthLabel,
  yearLabel,
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
  monthLabel: string;
  yearLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToggleDate: (date: string) => void;
  onClear: () => void;
  onMonthYear: (year: number, month: number) => void;
}) {
  const selectedParts = selectedDate ? mealDateParts(selectedDate, locale) : null;

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
          <DateField key={`${year}-${month}`} variant="month-year" size={{ height: 36, fontSize: 14, borderRadius: 12 }} year={year} month={month + 1}
            labels={{ month: monthLabel, year: yearLabel, locale }}
            onChange={(nextYear, nextMonth) => onMonthYear(nextYear, nextMonth - 1)} />
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
    </View>
  );
}
