// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 홈 달력 UTC 계산 및 이동 범위·비활성 색상

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DateField } from '../../../components/DateField';
import { HomeAssetIcon } from '../../../components/HomeAssetIcon';
import type { Meal } from '../../../types/meal';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import { dateKey } from './homeCalendar';

export function HomeCalendarView({ language, now, meals, onDate }: { language: Language; now: Date; meals: Meal[]; onDate: (date: string) => void }) {
  const s = copyFor(language);
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const [month, setMonth] = useState(() => new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)));
  const y = month.getUTCFullYear(), m = month.getUTCMonth();
  const canGoPrevious = y * 12 + m > 1900 * 12;
  const canGoNext = y * 12 + m < now.getFullYear() * 12 + now.getMonth();
  const leading = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const total = Math.ceil((leading + new Date(Date.UTC(y, m + 1, 0)).getUTCDate()) / 7) * 7;
  const counts = meals.reduce<Record<string, number>>((all, meal) => ({ ...all, [meal.mealDate]: (all[meal.mealDate] ?? 0) + 1 }), {});
  return <View style={styles.section}>
    <Text style={styles.title}>{s.home.calendar}</Text>
    <View style={styles.legend}>{(['density1', 'density2', 'density3'] as const).map((icon, i) => <View key={icon} style={styles.legendItem}><HomeAssetIcon name={icon} /><Text style={styles.legendText}>{[s.mealLog.legend1, s.mealLog.legend2, s.mealLog.legend3][i]}</Text></View>)}</View>
    <View style={styles.calendar}>
      <View style={styles.nav}>
        <Pressable accessibilityRole="button" accessibilityLabel={s.mealLog.previousMonth} disabled={!canGoPrevious} accessibilityState={{ disabled: !canGoPrevious }} style={!canGoPrevious && styles.disabledNav} onPress={() => { setMonth(new Date(Date.UTC(y, m - 1, 1))); }}><HomeAssetIcon name="prev" /></Pressable>
        <DateField key={`${y}-${m}`} variant="month-year" size={{ height: 32, fontSize: 13, borderRadius: 10 }} year={y} month={m + 1}
          labels={{ month: s.mealCheckin.month, year: s.mealCheckin.year, locale }}
          onChange={(year, nextMonth) => setMonth(new Date(Date.UTC(year, nextMonth - 1, 1)))} />
        <Pressable accessibilityRole="button" accessibilityLabel={s.mealLog.nextMonth} disabled={!canGoNext} accessibilityState={{ disabled: !canGoNext }} style={!canGoNext && styles.disabledNav} onPress={() => { setMonth(new Date(Date.UTC(y, m + 1, 1))); }}><HomeAssetIcon name="next" /></Pressable>
      </View>
      <View style={styles.week}>{Array.from({ length: 7 }, (_, i) => <Text key={i} style={styles.weekday}>{new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 4 + i)))}</Text>)}</View>
      <View style={styles.days}>{Array.from({ length: total }, (_, i) => {
        const date = new Date(Date.UTC(y, m, i - leading + 1)), key = date.toISOString().slice(0, 10), count = counts[key] ?? 0;
        return <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${key} · ${s.mealLog.logsOnDay(date.getUTCDate(), count)}`} disabled={key > dateKey(now)} accessibilityState={{ disabled: key > dateKey(now) }} onPress={() => onDate(key)} style={styles.day}>
          <View style={[styles.dayFill, count > 0 && { backgroundColor: [colors.logDensity1, colors.logDensity2, colors.logDensity3][Math.min(count, 3) - 1] }]}><Text style={[styles.dayText, (date.getUTCMonth() !== m || key > dateKey(now)) && { color: colors.homeCalendarAdjacent }, count >= 3 && { color: colors.surface }]}>{date.getUTCDate()}</Text></View>
        </Pressable>;
      })}</View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  disabledNav: { opacity: 0.3 },
  section: { gap: 10, paddingTop: 7 }, title: { fontFamily: fonts.interBold, fontSize: 16, lineHeight: 21, color: colors.homeCalendarHeading },
  legend: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 5 }, legendItem: { flexDirection: 'row', gap: 3, alignItems: 'center' }, legendText: { fontFamily: fonts.interMedium, fontSize: 12, color: colors.homeMuted, lineHeight: 15 },
  calendar: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.homeCalendarBorder, paddingHorizontal: 6, paddingTop: 8, paddingBottom: 6 },
  nav: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingBottom: 4, zIndex: 20 },
  week: { flexDirection: 'row' }, weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.interMedium, fontSize: 11, color: colors.homeCalendarMuted, lineHeight: 20 },
  days: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: '14.285714%', height: 35, alignItems: 'center', justifyContent: 'center' }, dayFill: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }, dayText: { color: colors.homeCalendarText, fontFamily: fonts.interMedium, fontSize: 14, lineHeight: 20 },
});
