// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { HomeAssetIcon } from '../../../components/HomeAssetIcon';
import type { Meal, MealDraft } from '../../../types/meal';
import type { ChildProfile, Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { displayDate } from '../../../util/date';
import { HomeCalendarView } from './HomeCalendarView';
import { homeStyles as styles } from './homeStyles';

export type HomeViewProps = {
  draft: MealDraft | null;
  draftLoading: boolean;
  draftError: boolean;
  onReviewDraft: () => void;
  profile: ChildProfile;
  language: Language;
  now: Date;
  data: { loggedDates: Set<string>; suggestions: { id: string; title: string; description: string }[] } | null;
  meals: Meal[];
  pendingMeals: Meal[];
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onLogMeal: () => void;
  onReviewMeal: (mealId: string) => void;
  onSavedSuggestions: () => void;
  onMealHistory: (date?: string) => void;
  onTrySuggestion: (id: string) => void;
  suggestionText: Record<string, { title: string; description: string }>;
};
export function HomeView(p: HomeViewProps) {
  const s = copyFor(p.language);
  const h = s.home;
  const name = p.profile.childName.trim();
  const caregiverName = p.profile.caregiverName.trim();
  const locale = p.language === 'ko' ? 'ko-KR' : 'en-GB';
  const day = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(p.now);
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(p.now);
  const greeting = (p.now.getHours() < 12 ? h.greetingMorning : p.now.getHours() < 18 ? h.greetingAfternoon : h.greetingEvening)(caregiverName);
  const fresh = !p.loading && !p.error && !p.meals.length && !p.draft;
  const idea = p.data?.suggestions[0];
  return <View style={styles.root}>
    <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} tintColor={colors.homePrimary} />}>
      <View style={styles.greeting}>
        <View style={styles.greetingCopy}>
          <Text style={styles.date}>{`${day} · ${date}`.toLocaleUpperCase(locale)}</Text>
          <Text style={styles.greetingTitle}>{greeting}</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toLocaleUpperCase(locale)}</Text></View>
      </View>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.glow} />
          <Text style={styles.eyebrow}>{h.mealFor(name)}</Text>
          <View style={styles.invitation}>
            <Text style={styles.heroTitle}>{h.nextTitle}</Text>
            <Text style={styles.heroBody}>{h.nextBody}</Text>
          </View>
          <AppButton variant="meal" label={p.draftLoading ? s.common.loading : p.meals.length ? h.logNewMeal : h.logMeal} disabled={p.draftLoading || p.draftError} icon={<HomeAssetIcon name="camera" />} style={styles.mealAction} labelStyle={styles.mealActionText} onPress={p.onLogMeal} />
        </View>
        {p.draftError && <View style={styles.state}><Text style={styles.stateText}>{s.mealCheckin.loadFailed}</Text><AppButton secondary label={s.common.retry} onPress={p.onRefresh} /></View>}
        {p.loading && <View style={styles.state}><ActivityIndicator color={colors.homePrimary} /><Text style={styles.stateText}>{s.common.loading}</Text></View>}
        {p.error && <View style={styles.state}><Text accessibilityRole="alert" style={styles.stateText}>{h.refreshFailed}</Text><AppButton secondary label={s.common.retry} onPress={p.onRefresh} /></View>}
        {p.pendingMeals.length > 0 && <View style={[styles.section, { marginBottom: -6 }]}>
          <Text style={styles.sectionTitle}>{h.afterMealTitle}</Text>
          {p.pendingMeals.map(meal => <Pressable key={meal.id} accessibilityRole="button" accessibilityLabel={`${name} · ${s.mealCheckin.types[meal.mealType]} · ${displayDate(meal.mealDate, p.language, true)} · ${h.awaitingReview}`} onPress={() => p.onReviewMeal(meal.id)} style={styles.reviewCard}>
            <View style={styles.mealCopy}>
              <Text style={styles.mealTitle}>{name} · {s.mealCheckin.types[meal.mealType]}</Text>
              <Text style={styles.mealMeta}>{displayDate(meal.mealDate, p.language, true)} · {s.mealCheckin.draftFoodCount(meal.foods.length)}</Text>
            </View>
            <View style={styles.reviewAction}><Text style={styles.reviewStatus}>{h.awaitingReview}</Text><HomeAssetIcon name="review" /></View>
          </Pressable>)}
        </View>}
        {fresh && <>
          <HomeCalendarView language={p.language} now={p.now} meals={p.meals} onDate={p.onMealHistory} />
          <Pressable accessibilityRole="button" onPress={p.onLogMeal} style={[styles.sectionAction, { marginTop: -8 }]}><Text style={styles.sectionActionText}>{h.logAMeal}</Text><HomeAssetIcon name="chevron" /></Pressable>
        </>}
        {!p.loading && !p.error && <View style={[styles.section, { gap: 10 }]}>
          <Text style={styles.sectionTitle}>{fresh ? h.savedEmptyTitle : h.savedTitle}</Text>
          <View style={styles.suggestionCard}>
          {idea ? (
            <Pressable accessibilityRole="button" onPress={() => p.onTrySuggestion(idea.id)} style={styles.ideaRow}>
              <HomeAssetIcon name="suggestion" />
              <View style={styles.ideaCopy}>
                <Text style={styles.ideaTitle}>
                  {p.suggestionText[idea.id]?.title ?? idea.title}
                </Text>
                <Text style={styles.mealMeta}>
                  {h.savedHint}
                </Text>
              </View>
            </Pressable>
          ) : (
            <Text style={styles.ideaTitle}>
              {h.noRecommendations}
            </Text>
        )}
            <Pressable accessibilityRole="button" onPress={idea ? p.onSavedSuggestions : () => p.onMealHistory()} style={styles.sectionAction}>
              <Text style={styles.sectionActionText}>{idea ? h.viewSaved : h.viewHistory}</Text><HomeAssetIcon name="chevron" />
            </Pressable>
          </View>
        </View>}
      </View>
    </ScrollView>
  </View>;
}
