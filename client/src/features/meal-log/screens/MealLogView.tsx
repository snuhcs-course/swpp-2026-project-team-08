// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
import { AppHeader } from '../../../components/AppHeader';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppButton } from '../../../components/AppButton';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { MealLogCalendar } from '../components/MealLogCalendar';
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

export function MealLogView(p: Props) {
  const s = copyFor(p.language);
  const m = s.mealLog;
  const locale = p.language === 'ko' ? 'ko-KR' : 'en-US';
  const [searchFocused, setSearchFocused] = useState(false);
  const searching = !!p.query.trim();
  const emptySearch = searching && !p.records.length;
  const emptyFirst = !p.hasMeals && !searching;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader title={m.title} backLabel={s.common.back} onBack={p.onBack} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} tintColor={colors.homePrimary} />
        }
      >
        {!searchFocused ? (
          <>
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
          </>
        ) : null}
        <View style={[styles.search, searchFocused && styles.searchFocused]}>
          <TextInput
            value={p.search}
            onChangeText={p.onSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onSubmitEditing={p.onSubmitSearch}
            placeholder={m.searchPlaceholder}
            placeholderTextColor={colors.homeMuted}
            accessibilityLabel={m.searchPlaceholder}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          <Pressable accessibilityRole="button" accessibilityLabel={m.searchPlaceholder} onPress={p.onSubmitSearch} hitSlop={8}>
            <Feather name="search" size={16} color={colors.homeMuted} />
          </Pressable>
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.fromLabel}>{p.fromLabel}</Text>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: p.unreviewedOnly }}
            onPress={p.onToggleUnreviewed}
            style={styles.filter}
          >
            <View style={[styles.checkbox, p.unreviewedOnly && styles.checkboxOn]}>
              {p.unreviewedOnly ? <Feather name="check" size={12} color={colors.surface} /> : null}
            </View>
            <Text style={styles.filterLabel}>{m.unreviewedOnly}</Text>
          </Pressable>
        </View>
        {searching ? <Text style={styles.resultCount}>{m.mealCount(p.records.length)}</Text> : null}
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {p.loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.homePrimary} />
              <Text style={styles.stateText}>{s.common.loading}</Text>
            </View>
          ) : p.error ? (
            <View style={styles.state}>
              <Text style={styles.stateText}>{m.loadFailed}</Text>
              <AppButton label={s.common.retry} onPress={p.onRefresh} />
            </View>
          ) : p.records.length ? (
            p.records.map((row) => (
              <Pressable
                key={row.id}
                accessibilityRole="button"
                onPress={() => p.onOpenMeal(row.id)}
                style={styles.record}
              >
                <View style={styles.thumb}>
                  {row.photoUri
                    ? <Image source={{ uri: row.photoUri }} style={styles.photo} contentFit="cover" />
                    : <Feather name="image" size={20} color={colors.homeMuted} />}
                </View>
                <View style={styles.recordCopy}>
                  <View style={styles.recordTitleRow}>
                    <Text style={styles.recordTitle} numberOfLines={1}>{row.title}</Text>
                    <View style={[styles.badge, row.awaiting ? styles.awaiting : styles.reviewed]}>
                      <Text style={row.awaiting ? styles.awaitingText : styles.reviewedText}>
                        {row.awaiting ? m.awaitingReview : m.reviewed}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recordFoods} numberOfLines={2}>{row.foods}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.homeMuted} />
              </Pressable>
            ))
          ) : (
            <View style={styles.empty}>
              {emptyFirst ? <Feather name="calendar" size={28} color={colors.homeMuted} /> : null}
              <Text style={styles.emptyTitle}>{emptySearch ? m.noMatchingTitle : m.emptyTitle}</Text>
              <Text style={styles.emptyBody}>
                {emptySearch ? m.noMatchingBody(p.query.trim()) : m.emptyBody}
              </Text>
              {emptyFirst ? (
                <Pressable accessibilityRole="button" onPress={p.onGoCheckin} style={styles.checkinButton}>
                  <Text style={styles.checkinLabel}>{m.goToCheckin}</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
