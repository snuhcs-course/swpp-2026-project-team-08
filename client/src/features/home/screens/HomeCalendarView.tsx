// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const [picker, setPicker] = useState<'month' | 'year' | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const y = month.getFullYear(), m = month.getMonth();
  const leading = new Date(y, m, 1).getDay();
  const total = Math.ceil((leading + new Date(y, m + 1, 0).getDate()) / 7) * 7;
  const counts = meals.reduce<Record<string, number>>((all, meal) => ({ ...all, [meal.mealDate]: (all[meal.mealDate] ?? 0) + 1 }), {});
  const options = picker === 'year' ? Array.from({ length: 201 }, (_, i) => 1900 + i) : Array.from({ length: 12 }, (_, i) => i);
  const choose = (value: number) => { setMonth(picker === 'year' ? new Date(value, m, 1) : new Date(y, value, 1)); setPicker(null); };
  return <View style={styles.section}>
    <Text style={styles.title}>{s.home.calendar}</Text>
    <View style={styles.legend}>{(['density1', 'density2', 'density3'] as const).map((icon, i) => <View key={icon} style={styles.legendItem}><HomeAssetIcon name={icon} /><Text style={styles.legendText}>{[s.mealLog.legend1, s.mealLog.legend2, s.mealLog.legend3][i]}</Text></View>)}</View>
    <View style={styles.calendar}>
      <View style={styles.nav}>
        <Pressable accessibilityRole="button" accessibilityLabel={s.mealLog.previousMonth} onPress={() => { setMonth(new Date(y, m - 1, 1)); setPicker(null); }}><HomeAssetIcon name="prev" /></Pressable>
        <View style={styles.fields}>
          {(['month', 'year'] as const).map(field => <View key={field} style={[styles.fieldWrap, picker === field && { zIndex: 30 }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={field === 'month' ? s.mealCheckin.month : s.mealCheckin.year} accessibilityState={{ expanded: picker === field }} style={styles.field} onPress={() => setPicker(picker === field ? null : field)}>
              <Text style={styles.fieldText}>{field === 'month' ? new Intl.DateTimeFormat(locale, { month: 'short' }).format(month) : y}</Text><HomeAssetIcon name="caret" />
            </Pressable>
            {picker === field && <View style={styles.options}><ScrollView ref={scrollRef} nestedScrollEnabled style={{ maxHeight: 180 }} onContentSizeChange={() => scrollRef.current?.scrollTo({ y: Math.max(0, (field === 'month' ? m : y - 1900) - 2) * 36, animated: false })}>{options.map(value => <Pressable key={value} accessibilityRole="button" onPress={() => choose(value)} style={[styles.option, value === (field === 'month' ? m : y) && { backgroundColor: colors.homeSelected }]}><Text style={styles.fieldText}>{field === 'month' ? new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(y, value, 1)) : value}</Text></Pressable>)}</ScrollView></View>}
          </View>)}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={s.mealLog.nextMonth} onPress={() => { setMonth(new Date(y, m + 1, 1)); setPicker(null); }}><HomeAssetIcon name="next" /></Pressable>
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
  nav: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingBottom: 4, zIndex: 20 }, fields: { flex: 1, flexDirection: 'row', gap: 8 }, fieldWrap: { flex: 1, position: 'relative' },
  field: { height: 32, borderWidth: 1, borderColor: colors.homeCalendarField, borderRadius: 10, paddingLeft: 10, paddingRight: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, fieldText: { fontFamily: fonts.interMedium, fontSize: 13, lineHeight: 17, color: colors.homeCalendarText },
  options: { position: 'absolute', top: 34, left: 0, right: 0, maxHeight: 180, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.homeCalendarField, borderRadius: 10, overflow: 'hidden', elevation: 6 }, option: { height: 36, paddingHorizontal: 10, justifyContent: 'center' },
  week: { flexDirection: 'row' }, weekday: { flex: 1, textAlign: 'center', fontFamily: fonts.interMedium, fontSize: 11, color: colors.homeCalendarMuted, lineHeight: 20 },
  days: { flexDirection: 'row', flexWrap: 'wrap' }, day: { width: '14.285714%', height: 35, alignItems: 'center', justifyContent: 'center' }, dayFill: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }, dayText: { color: colors.homeCalendarText, fontFamily: fonts.interMedium, fontSize: 14, lineHeight: 20 },
});
