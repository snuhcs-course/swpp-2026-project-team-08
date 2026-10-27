// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Scrollable meal sheet content with loading, error, and empty states

import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import type { MealLogRow } from '../screens/MealLogView';
import { styles } from '../screens/mealLogStyles';

type Props = {
  language: Language;
  records: MealLogRow[];
  query: string;
  hasMeals: boolean;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenMeal: (id: string) => void;
  onGoCheckin: () => void;
};

export function MealLogList(p: Props) {
  const s = copyFor(p.language);
  const m = s.mealLog;
  const searching = !!p.query.trim();
  const emptySearch = searching && !p.records.length;
  const emptyFirst = !p.hasMeals && !searching;

  return (
    <ScrollView
      testID="meal-history-list"
      style={styles.root}
      contentContainerStyle={styles.sheetContent}
      contentInsetAdjustmentBehavior="automatic"
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh}
          tintColor={colors.homePrimary} />
      }
    >
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
    </ScrollView>
  );
}
