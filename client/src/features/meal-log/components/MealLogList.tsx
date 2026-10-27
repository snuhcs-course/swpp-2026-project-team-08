// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Measured sheet filters with minimum-height mode and no refresh gestures

import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { bottomNavigationHeight } from '../../../components/BottomNavigation';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import type { MealLogRow } from '../screens/MealLogView';
import { styles } from '../screens/mealLogStyles';

type Props = {
  language: Language;
  minimum: boolean;
  onFiltersLayout: (height: number) => void;
  records: MealLogRow[];
  search: string;
  fromLabel: string;
  unreviewedOnly: boolean;
  onSearch: (value: string) => void;
  onSubmitSearch: () => void;
  onToggleUnreviewed: () => void;
  query: string;
  hasMeals: boolean;
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
  onOpenMeal: (id: string) => void;
  onGoCheckin: () => void;
};

export function MealLogList(p: Props) {
  const insets = useSafeAreaInsets();
  const s = copyFor(p.language);
  const m = s.mealLog;
  const [searchFocused, setSearchFocused] = useState(false);
  const searching = !!p.query.trim();
  const emptySearch = searching && !p.records.length;
  const emptyFirst = !p.hasMeals && !searching;

  return (
    <ScrollView
      testID="meal-history-list"
      style={styles.root}
      contentContainerStyle={[styles.sheetContent, Platform.OS === 'ios' && {
        paddingBottom: styles.sheetContent.paddingBottom
          + bottomNavigationHeight(insets.bottom) - insets.bottom,
      }]}
      contentInsetAdjustmentBehavior="automatic"
      stickyHeaderIndices={[0]}
      scrollEnabled={!p.minimum}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.sheetFilters}>
        <View onLayout={event => p.onFiltersLayout(event.nativeEvent.layout.height)}>
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
        </View>
        {!p.minimum && searching ? <Text style={styles.resultCount}>{m.mealCount(p.records.length)}</Text> : null}
      </View>
      {p.minimum ? null : p.loading ? (
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
    </ScrollView>
  );
}
