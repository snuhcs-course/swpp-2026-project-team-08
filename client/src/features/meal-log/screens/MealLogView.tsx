// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim
// Changed: 식사 기록 화면 디자인 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Three-height native meal sheet defaulting to search and filters only

import { AppHeader } from '../../../components/AppHeader';
import { useState, type Ref } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { MealLogCalendar } from '../components/MealLogCalendar';
import { MealLogList } from '../components/MealLogList';
import { MealLogSheetLayout, type MealLogSheetHandle } from '../components/MealLogSheetLayout';
import { styles } from './mealLogStyles';

export type MealLogRow = {
  id: string;
  title: string;
  foods: string;
  photoUri: string | null;
  awaiting: boolean;
};

type Props = {
  language: Language;
  year: number;
  month: number;
  selectedDate: string | null;
  counts: Record<string, number>;
  search: string;
  fromLabel: string;
  unreviewedOnly: boolean;
  records: MealLogRow[];
  query: string;
  hasMeals: boolean;
  draftName: string | null;
  draftMeta: string | null;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  active: boolean;
  sheetRef: Ref<MealLogSheetHandle>;
  onBack: () => void;
  onRefresh: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthYear: (year: number, month: number) => void;
  onToggleDate: (date: string) => void;
  onClearDate: () => void;
  onSearch: (value: string) => void;
  onSubmitSearch: () => void;
  onToggleUnreviewed: () => void;
  onContinueDraft: () => void;
  onOpenMeal: (id: string) => void;
  onGoCheckin: () => void;
};

export function MealLogView({ sheetRef, ...p }: Props) {
  const s = copyFor(p.language);
  const m = s.mealLog;
  const locale = p.language === 'ko' ? 'ko-KR' : 'en-US';
  const [controlsHeight, setControlsHeight] = useState(0);
  const [filtersHeight, setFiltersHeight] = useState(72);
  const [minimum, setMinimum] = useState(Platform.OS !== 'web');
  if (!p.active && minimum !== (Platform.OS !== 'web')) {
    setMinimum(Platform.OS !== 'web');
  }

  return (
    <MealLogSheetLayout ref={sheetRef} controlsHeight={controlsHeight} filtersHeight={filtersHeight}
      onMinimumChange={setMinimum} active={p.active} onBack={p.onBack}
      sheet={<MealLogList minimum={minimum} onFiltersLayout={setFiltersHeight}
        language={p.language} records={p.records} query={p.query}
        hasMeals={p.hasMeals} loading={p.loading} error={p.error}
        search={p.search} fromLabel={p.fromLabel} unreviewedOnly={p.unreviewedOnly}
        onSearch={p.onSearch} onSubmitSearch={p.onSubmitSearch}
        onToggleUnreviewed={p.onToggleUnreviewed}
        onRefresh={p.onRefresh} onOpenMeal={p.onOpenMeal} onGoCheckin={p.onGoCheckin} />}>
      <View style={styles.root}>
        <AppHeader title={m.title} backLabel={s.common.back} onBack={p.onBack} />
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.controlsScroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} tintColor={colors.homePrimary} />
          }
        >
          <View style={styles.controls} onLayout={event => setControlsHeight(event.nativeEvent.layout.height)}>
            {p.draftMeta ? (
              <View style={styles.continueBlock} accessibilityLabel={m.continueLogging}>
                <Text style={styles.sectionLabel}>{m.continueLogging}</Text>
                <View style={styles.continueCard}>
                  <View style={styles.continueCopy}>
                    <Text style={styles.continueTitle}>{p.draftMeta}</Text>
                    <View style={styles.continueSubtitle}>
                      <Text style={styles.continueDraft}>{m.draft}</Text>
                      {p.draftName ? (
                        <Text style={styles.continueFood} numberOfLines={1}>{p.draftName}</Text>
                      ) : null}
                    </View>
                  </View>
                  <Pressable accessibilityRole="button" onPress={p.onContinueDraft} style={styles.resume}>
                    <Text style={styles.resumeLabel}>{m.resume}</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <MealLogCalendar
              monthLabel={s.mealCheckin.month}
              yearLabel={s.mealCheckin.year}
              year={p.year}
              month={p.month}
              selectedDate={p.selectedDate}
              counts={p.counts}
              weekdays={m.weekdays}
              title={m.calendarTitle}
              clearLabel={m.clear}
              legend1={m.legend1}
              legend2={m.legend2}
              legend3={m.legend3}
              previousMonth={m.previousMonth}
              nextMonth={m.nextMonth}
              selectedDayLabel={m.selectedDay}
              logsOnDay={m.logsOnDay}
              selectedDateLabel={m.selectedDate}
              noneYet={m.noneYet}
              locale={locale}
              onPrev={p.onPrevMonth}
              onNext={p.onNextMonth}
              onToggleDate={p.onToggleDate}
              onClear={p.onClearDate}
              onMonthYear={p.onMonthYear}
            />
          </View>
        </ScrollView>
      </View>
    </MealLogSheetLayout>
  );
}
