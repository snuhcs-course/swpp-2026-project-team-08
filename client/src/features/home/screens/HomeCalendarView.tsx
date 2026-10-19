// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
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
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const y = month.getFullYear(), m = month.getMonth();
  const leading = new Date(y, m, 1).getDay();
  const total = Math.ceil((leading + new Date(y, m + 1, 0).getDate()) / 7) * 7;
  const counts = meals.reduce<Record<string, number>>((all, meal) => ({ ...all, [meal.mealDate]: (all[meal.mealDate] ?? 0) + 1 }), {});
  return <View style={styles.section}>
    <Text style={styles.title}>{s.home.calendar}</Text>
    <View style={styles.legend}>{(['density1', 'density2', 'density3'] as const).map((icon, i) => <View key={icon} style={styles.legendItem}><HomeAssetIcon name={icon} /><Text style={styles.legendText}>{[s.mealLog.legend1, s.mealLog.legend2, s.mealLog.legend3][i]}</Text></View>)}</View>
    <View style={styles.calendar}>
      <View style={styles.nav}>
        <Pressable accessibilityRole="button" accessibilityLabel={s.mealLog.previousMonth} onPress={() => { setMonth(new Date(y, m - 1, 1)); }}><HomeAssetIcon name="prev" /></Pressable>
        <DateField key={`${y}-${m}`} variant="month-year" size={{ height: 32, fontSize: 13, borderRadius: 10 }} year={y} month={m + 1}
          labels={{ month: s.mealCheckin.month, year: s.mealCheckin.year, locale }}
          onChange={(year, nextMonth) => setMonth(new Date(year, nextMonth - 1, 1))} />
        <Pressable accessibilityRole="button" accessibilityLabel={s.mealLog.nextMonth} onPress={() => { setMonth(new Date(y, m + 1, 1)); }}><HomeAssetIcon name="next" /></Pressable>
      </View>
      <View style={styles.week}>{Array.from({ length: 7 }, (_, i) => <Text key={i} style={styles.weekday}>{new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2026, 0, 4 + i))}</Text>)}</View>
      <View style={styles.days}>{Array.from({ length: total }, (_, i) => {
        const date = new Date(y, m, i - leading + 1), key = dateKey(date), count = counts[key] ?? 0;
        return <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${key} · ${s.mealLog.logsOnDay(date.getDate(), count)}`} onPress={() => onDate(key)} style={styles.day}>
          <View style={[styles.dayFill, count > 0 && { backgroundColor: [colors.logDensity1, colors.logDensity2, colors.logDensity3][Math.min(count, 3) - 1] }]}><Text style={[styles.dayText, date.getMonth() !== m && { color: colors.homeCalendarAdjacent }, count >= 3 && { color: colors.surface }]}>{date.getDate()}</Text></View>
        </Pressable>;
      })}</View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: 10, paddingTop: 7 }, title: { fontFamily: fonts.interBold, fontSize: 16, lineHeight: 21, color: colors.homeCalendarHeading },
  legend: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 5 }, legendItem: { flexDirection: 'row', gap: 3, alignItems: 'center' }, legendText: { fontFamily: fonts.interMedium, fontSize: 12, color: colors.homeMuted, lineHeight: 15 },
  calendar: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.homeCalendarBorder, paddingHorizontal: 6, paddingTop: 8, paddingBottom: 6 },
  nav: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingBottom: 4, zIndex: 20 },
  week: { flexDirection: 'row' }, weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.interMedium, fontSize: 11, color: colors.homeCalendarMuted, lineHeight: 20 },
  days: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: '14.285714%', height: 35, alignItems: 'center', justifyContent: 'center' }, dayFill: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }, dayText: { color: colors.homeCalendarText, fontFamily: fonts.interMedium, fontSize: 14, lineHeight: 20 },
});
