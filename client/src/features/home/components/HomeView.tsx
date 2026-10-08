import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppButton } from '../../../components/AppButton';
import type { MealDraft } from '../../../types/meal';
import type { ReactNode } from 'react';
import type { ChildProfile, Language } from '../../../types/profile';
import type { ExposureSummary, SavedSuggestion } from '../../../types/home';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import { calendarCells, dateKey } from '../rules';

type Props = {
  draft: MealDraft | null;
  draftLoading: boolean;
  draftError: boolean;
  onReviewDraft: () => void;
  profile: ChildProfile;
  language: Language;
  now: Date;
  data: {
    loggedDates: Set<string>;
    exposures: ExposureSummary[];
    suggestions: SavedSuggestion[];
  } | null;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onLogMeal: () => void;
  onTrySuggestion: (id: string) => void;
};

function HomeCard({
  title,
  subtitle,
  accessory,
  children,
  style,
}: {
  title: string;
  subtitle: string;
  accessory?: ReactNode;
  children: ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeading}>
        <View style={styles.cardHeadingCopy}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        {accessory}
      </View>
      {children}
    </View>
  );
}

export function HomeView({
  draft,
  draftLoading,
  draftError,
  onReviewDraft,
  profile,
  language,
  now,
  data,
  loading,
  error,
  refreshing,
  onRefresh,
  onLogMeal,
  onTrySuggestion,
}: Props) {
  const s = copyFor(language);
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const { width } = useWindowDimensions();
  const daySize = Math.min(40, Math.floor((width - 48 - 32 - 36) / 7));
  const greeting =
    now.getHours() < 12
      ? s.home.greetingMorning(profile.caregiverName)
      : now.getHours() < 18
        ? s.home.greetingAfternoon(profile.caregiverName)
        : s.home.greetingEvening(profile.caregiverName);
  const cells = calendarCells(now.getFullYear(), now.getMonth());
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'short' }).format(
    now,
  );
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
      new Date(2024, 0, index + 1),
    ),
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.homePrimary}
          />
        }
      >
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.date}>
              {new Intl.DateTimeFormat(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
                .format(now)
                .toLocaleUpperCase(locale)}
            </Text>
            <Text style={styles.greeting}>{greeting}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.caregiverName.trim().charAt(0).toLocaleUpperCase(locale)}
            </Text>
          </View>
        </View>

        <View style={styles.nextCard}>
          <View style={styles.nextDecoration} />
          <Text style={styles.nextEyebrow}>{s.home.nextUp}</Text>
          <Text style={styles.nextTitle}>{s.home.nextTitle}</Text>
          <Text style={styles.nextBody}>{s.home.nextBody}</Text>
          <Pressable
            onPress={onLogMeal}
            disabled={draftLoading || draftError}
            accessibilityRole="button"
            style={styles.nextButton}
          >
            <MaterialCommunityIcons
              name="camera-outline"
              size={18}
              color={colors.surface}
            />
            <Text style={styles.nextButtonText}>
              {draftLoading
                ? s.common.loading
                : draft
                  ? s.mealCheckin.resume
                  : s.home.logMeal}
            </Text>
          </Pressable>
        </View>

        {draftError && (
          <View style={styles.card}>
            <Text style={styles.stateText}>{s.mealCheckin.loadFailed}</Text>
            <AppButton label={s.common.retry} onPress={onRefresh} />
          </View>
        )}
        {draft && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{s.mealCheckin.resume}</Text>
            <Text style={styles.rowDescription}>
              {draft.mealDate} · {s.mealCheckin.foodCount(draft.foods.length)}
            </Text>
            <AppButton
              variant="meal"
              secondary
              label={s.mealCheckin.draftReview}
              onPress={onReviewDraft}
            />
          </View>
        )}
        {loading && (
          <View style={styles.state}>
            <ActivityIndicator color={colors.homePrimary} />
            <Text style={styles.stateText}>{s.common.loading}</Text>
          </View>
        )}
        {error && (
          <Pressable
            onPress={onRefresh}
            style={styles.state}
            accessibilityRole="button"
          >
            <Text style={styles.stateText}>
              {s.home.refreshFailed} {s.common.retry}
            </Text>
          </Pressable>
        )}
        {data && (
          <>
            <HomeCard
              title={s.home.sosTitle}
              subtitle={s.home.sosBody}
              style={styles.sosCard}
              accessory={
                <View style={styles.count}>
                  <Text style={styles.countText}>
                    {s.home.itemCount(data.exposures.length)}
                  </Text>
                </View>
              }
            >
              {data.exposures.length ? (
                data.exposures.slice(0, 2).map((entry, index) => (
                  <View
                    key={entry.id}
                    style={[styles.listRow, index > 0 && styles.dividedRow]}
                  >
                    <View style={styles.iconTile}>
                      <MaterialCommunityIcons
                        name="food-apple-outline"
                        size={21}
                        color={colors.homePrimary}
                      />
                    </View>
                    <View style={styles.rowCopy}>
                      <View style={styles.rowTop}>
                        <Text style={styles.rowTitle}>{entry.foodName}</Text>
                        <Text style={styles.stage}>{entry.stage}</Text>
                      </View>
                      <Text style={styles.rowDescription}>
                        {entry.description}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyRow}>
                  <View style={styles.iconTile}>
                    <MaterialCommunityIcons
                      name="food-apple-outline"
                      size={20}
                      color={colors.homePrimary}
                    />
                  </View>
                  <Text style={styles.emptyText}>{s.home.noExposure}</Text>
                </View>
              )}
            </HomeCard>

            <HomeCard
              title={s.home.recommendations}
              subtitle={s.home.goalsSubtitle}
              style={styles.goalsCard}
            >
              {data.suggestions.length ? (
                data.suggestions.slice(0, 1).map((item) => (
                  <View key={item.id} style={styles.goalRow}>
                    <View style={styles.iconTile}>
                      <MaterialCommunityIcons
                        name="lightbulb-outline"
                        size={20}
                        color={colors.homePrimary}
                      />
                    </View>
                    <View style={styles.goalCopy}>
                      <Text numberOfLines={1} style={styles.rowTitle}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={2} style={styles.rowDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => onTrySuggestion(item.id)}
                      accessibilityRole="button"
                      style={styles.tryPill}
                    >
                      <Text style={styles.tryText}>{s.home.try}</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <View style={styles.emptyRow}>
                  <View style={styles.iconTile}>
                    <MaterialCommunityIcons
                      name="lightbulb-outline"
                      size={20}
                      color={colors.homePrimary}
                    />
                  </View>
                  <Text style={styles.emptyText}>
                    {s.home.noRecommendations}
                  </Text>
                </View>
              )}
            </HomeCard>

            <HomeCard
              title={s.home.calendar}
              subtitle={s.home.calendarSubtitle}
              style={styles.calendarCard}
              accessory={
                <View style={styles.monthPill}>
                  <Text style={styles.monthText}>{monthTitle}</Text>
                </View>
              }
            >
              <View style={styles.calendarGrid}>
                {weekdayLabels.map((label, index) => (
                  <Text
                    key={`w-${index}`}
                    style={[styles.weekday, { width: daySize }]}
                  >
                    {label}
                  </Text>
                ))}
                {cells.map((day, index) => {
                  const key = day
                    ? dateKey(new Date(now.getFullYear(), now.getMonth(), day))
                    : '';
                  const logged = !!day && data.loggedDates.has(key);
                  return (
                    <View
                      key={`d-${index}`}
                      style={[
                        styles.daySlot,
                        { width: daySize, height: daySize },
                      ]}
                    >
                      {day && (
                        <View
                          accessibilityLabel={s.home.calendarDayStatus(
                            day,
                            logged,
                          )}
                          style={[styles.day, logged && styles.loggedDay]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              logged && styles.loggedText,
                            ]}
                          >
                            {day}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </HomeCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  content: {
    paddingHorizontal: 24,
    paddingTop: 29,
    paddingBottom: 24,
    gap: 18,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    marginBottom: 11,
  },
  headingCopy: { flex: 1 },
  date: {
    color: colors.homePrimary,
    fontSize: 9,
    fontFamily: fonts.poppinsBold,
    letterSpacing: 0.2,
  },
  greeting: {
    color: colors.homeText,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.poppinsSemiBold,
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.homeSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.homeText,
    fontSize: 12,
    fontFamily: fonts.poppinsBold,
  },
  nextCard: {
    height: 194,
    backgroundColor: colors.navy,
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
    shadowColor: colors.navy,
    shadowOpacity: 0.13,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 28,
    elevation: 4,
  },
  nextDecoration: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    right: -18,
    top: -22,
    backgroundColor: colors.navyDecoration,
  },
  nextEyebrow: {
    color: colors.surface,
    fontSize: 9,
    fontFamily: fonts.poppinsBold,
  },
  nextTitle: {
    color: colors.surface,
    fontSize: 16,
    fontFamily: fonts.poppinsSemiBold,
    marginTop: 7,
  },
  nextBody: {
    color: colors.surface,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.poppinsRegular,
    marginTop: 7,
    maxWidth: 260,
  },
  nextButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
    height: 54,
    backgroundColor: colors.homePrimary,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  nextButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontFamily: fonts.poppinsSemiBold,
    flexShrink: 0,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: colors.navy,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 2,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 41,
  },
  cardHeadingCopy: { flex: 1, gap: 2 },
  cardTitle: {
    color: colors.homeText,
    fontSize: 16,
    fontFamily: fonts.poppinsSemiBold,
  },
  cardSubtitle: {
    color: colors.homeMuted,
    fontSize: 9,
    lineHeight: 13,
    fontFamily: fonts.poppinsRegular,
  },
  sosCard: { minHeight: 211 },
  goalsCard: { minHeight: 140 },
  calendarCard: { minHeight: 300 },
  count: {
    alignSelf: 'flex-start',
    backgroundColor: colors.homeSelected,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countText: {
    color: colors.homePrimary,
    fontSize: 9,
    fontFamily: fonts.poppinsBold,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 53,
  },
  dividedRow: {
    borderTopWidth: 1,
    borderTopColor: colors.homeBorder,
    paddingTop: 14,
    marginTop: 0,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.homeSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, gap: 4 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 7,
  },
  rowTitle: {
    color: colors.homeText,
    fontSize: 12,
    fontFamily: fonts.poppinsSemiBold,
  },
  stage: {
    color: colors.homePrimary,
    fontSize: 9,
    fontFamily: fonts.poppinsBold,
  },
  rowDescription: {
    color: colors.homeMuted,
    fontSize: 9,
    lineHeight: 13,
    fontFamily: fonts.poppinsRegular,
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 53,
  },
  emptyText: {
    flex: 1,
    color: colors.homeMuted,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.poppinsRegular,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 53,
  },
  goalCopy: { flex: 1, gap: 3 },
  tryPill: {
    backgroundColor: colors.calendarEmpty,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tryText: {
    color: colors.homeText,
    fontSize: 10,
    fontFamily: fonts.poppinsBold,
  },
  monthPill: {
    backgroundColor: colors.calendarEmpty,
    borderRadius: 999,
    minWidth: 44,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  monthText: {
    color: colors.homeText,
    fontSize: 10,
    fontFamily: fonts.poppinsBold,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 6,
    rowGap: 8,
    justifyContent: 'space-between',
  },
  weekday: {
    color: colors.homeSubtitle,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: fonts.poppinsBold,
    lineHeight: 15,
  },
  daySlot: { alignItems: 'center', justifyContent: 'center' },
  day: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: colors.calendarEmpty,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedDay: { backgroundColor: colors.homePrimary },
  dayText: {
    color: colors.homeText,
    fontSize: 12,
    fontFamily: fonts.poppinsSemiBold,
  },
  loggedText: { color: colors.surface, fontFamily: fonts.poppinsBold },
  state: {
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stateText: {
    color: colors.homeMuted,
    fontSize: 11,
    fontFamily: fonts.poppinsRegular,
  },
});
