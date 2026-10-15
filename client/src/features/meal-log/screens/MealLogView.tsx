// AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim

import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { AppIcon } from '../../../components/AppIcon';
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
  draftName: string | null;
  draftMeta: string | null;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToggleDay: (day: number) => void;
  onClearDate: () => void;
  onSearch: (value: string) => void;
  onToggleUnreviewed: () => void;
  onContinueDraft: () => void;
  onOpenMeal: (id: string) => void;
};

export function MealLogView(p: Props) {
  const s = copyFor(p.language);
  const m = s.mealLog;
  const locale = p.language === 'ko' ? 'ko-KR' : 'en-US';
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} tintColor={colors.homePrimary} />
      }
    >
      <Text accessibilityRole="header" style={styles.title}>{m.title}</Text>
      {p.draftName && p.draftMeta ? (
        <View style={styles.continue}>
          <AppIcon name="next" size={22} />
          <View style={styles.continueCopy}>
            <Text style={styles.continueEyebrow}>{m.continueLogging}</Text>
            <Text style={styles.continueTitle}>{p.draftName}</Text>
            <Text style={styles.continueMeta}>{p.draftMeta}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={p.onContinueDraft} style={styles.resume}>
            <Text style={styles.resumeLabel}>{m.resume}</Text>
          </Pressable>
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
        locale={locale}
        onPrev={p.onPrevMonth}
        onNext={p.onNextMonth}
        onToggleDay={p.onToggleDay}
        onClear={p.onClearDate}
      />
      <View style={styles.search}>
        <Feather name="search" size={16} color={colors.homeMuted} />
        <TextInput
          value={p.search}
          onChangeText={p.onSearch}
          placeholder={m.searchPlaceholder}
          placeholderTextColor={colors.homeMuted}
          accessibilityLabel={m.searchPlaceholder}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
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
            {row.photoUri
              ? <Image source={{ uri: row.photoUri }} style={styles.thumb} contentFit="cover" />
              : <View style={styles.thumb} />}
            <View style={styles.recordCopy}>
              <Text style={styles.recordTitle}>{row.title}</Text>
              <Text style={styles.recordFoods} numberOfLines={1}>{row.foods}</Text>
              <View style={[styles.badge, row.awaiting ? styles.awaiting : styles.reviewed]}>
                <Text style={row.awaiting ? styles.awaitingText : styles.reviewedText}>
                  {row.awaiting ? m.awaitingReview : m.reviewed}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.homeMuted} />
          </Pressable>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{p.query.trim() ? m.noMatchingTitle : m.emptyTitle}</Text>
          <Text style={styles.emptyBody}>
            {p.query.trim() ? m.noMatchingBody(p.query.trim()) : m.emptyBody}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
