// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; match review saved panel
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// This Code is generated with AI

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MealSavedPanel } from '../../../components/MealSavedPanel';
import { displayDate } from '../../../util/date';
import { AppButton } from '../../../components/AppButton';
import { SuggestionCard } from '../../../components/SuggestionCard';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { abcCopyFor, copyFor } from '../../../util/strings';
import type { ReviewViewProps } from './reviewViewTypes';

type Props = Pick<ReviewViewProps,
  'meal' | 'draft' | 'language' | 'suggestionCards' | 'savedSuggestions' | 'suggestionsLoading' |
  'onGoalFeedback' | 'onSuggestionFeedback' | 'onNextSuggestion' | 'onRecommend' | 'onBack'> & { onHome: () => void };

export function AfterMealFollowUpView({ p }: { p: Props }) {
  const s = copyFor(p.language);
  const m = s.afterMealReview;
  const a = abcCopyFor(p.language);
  if (p.draft.step === 'goal') {
    const goalFood = p.meal.foods.find((food) => food.id === p.meal.exposureFoodId);
    return (
      <View style={styles.root}>
        <Text style={styles.title}>{m.titles.goal}</Text>
        {goalFood ? (
          <View style={styles.goalCard}>
            <Text style={styles.goalIcon}>◉</Text>
            <Text style={styles.goalText}>{m.goalFood(goalFood.name)}</Text>
          </View>
        ) : <Text style={styles.muted}>{m.noGoal}</Text>}
        {goalFood && (['achieved', 'tried', 'notYet'] as const).map((value) => (
          <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: p.draft.goalFeedback === value }} onPress={() => p.onGoalFeedback(value)} style={[styles.goalChoice, p.draft.goalFeedback === value && styles.selected]}>
            <Text style={[styles.goalChoiceText, p.draft.goalFeedback === value && styles.selectedText]}>{m.goalChoices[value]}</Text>
          </Pressable>
        ))}
      </View>
    );
  }
  if (p.draft.step === 'suggestions') {
    const current = p.savedSuggestions.find((item) => !p.draft.suggestionFeedback[item.id]);
    const index = current ? p.savedSuggestions.findIndex((item) => item.id === current.id) : -1;
    const card = current ? p.suggestionCards[current.id] ?? current : null;
    return (
      <View style={styles.root}>
        <Text style={styles.title}>{m.titles.suggestions}</Text>
        <Text style={styles.muted}>{m.suggestionPrompt}</Text>
        {current && <Text style={styles.muted}>{p.meal.foods.find((food) => food.id === p.meal.suggestionLinks?.find((link) => link.suggestionId === current.id)?.foodId)?.name}</Text>}
        {p.suggestionsLoading ? <Text style={styles.muted}>{s.common.loading}</Text> : current ? (
          <SuggestionCard
            badge={`${m.savedSuggestion} ${index + 1}`}
            title={card!.title}
            description={card!.description}
            servingTip={card!.servingTip}
            labels={m}
            onTried={() => p.onSuggestionFeedback(current.id, 'tried')}
            onNotTried={() => p.onSuggestionFeedback(current.id, 'notTried')}
          />
        ) : <View style={styles.emptyCard}>
          <Text style={styles.emptyLabel}>{m.recommendedNext}</Text>
          <Text style={styles.muted}>{p.savedSuggestions.length ? m.noNextSuggestion : m.noSavedSuggestions}</Text>
        </View>}
        <AppButton variant="meal" secondary label={s.common.back} onPress={p.onBack} />
      </View>
    );
  }
  return <MealSavedPanel title={a.reviewSavedTitle} message={m.saved}
    photos={[p.meal.photo?.uri, p.draft.afterPhoto?.uri].filter((uri): uri is string => !!uri)}
    date={`${s.mealCheckin.types[p.meal.mealType]}, ${displayDate(p.meal.mealDate, p.language)}`}
    foodNames={p.meal.foods.map((food) => food.name).join(', ')}
    note={p.meal.suggestionLinks?.length ? a.reviewPendingHint : undefined}
    actions={<>
      <AppButton variant="meal" label={a.viewMealSuggestions} onPress={p.onRecommend} style={{ minHeight: 48 }} labelStyle={{ fontSize: 16 }} />
      <AppButton variant="meal" secondary label={a.returnHome} onPress={p.onHome} style={{ minHeight: 48, borderWidth: 0, backgroundColor: colors.transparent }} labelStyle={{ fontSize: 16, color: colors.homePrimary }} />
    </>} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 12 },
  title: { color: colors.homeText, fontSize: 19, fontFamily: fonts.poppinsSemiBold },
  muted: { color: colors.mealReviewMuted, fontSize: 11, lineHeight: 17, fontFamily: fonts.interRegular },
  goalCard: { backgroundColor: colors.surface, borderColor: colors.mealReviewBorder, borderWidth: 1, borderRadius: 14, padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' },
  goalIcon: { color: colors.homePrimary, fontSize: 19 },
  goalText: { color: colors.homeText, fontFamily: fonts.interBold, fontSize: 12 },
  goalChoice: { backgroundColor: colors.surface, borderColor: colors.mealReviewBorder, borderWidth: 1, borderRadius: 12, padding: 12 },
  selected: { backgroundColor: colors.homePrimary, borderColor: colors.homePrimary },
  goalChoiceText: { color: colors.homeText, fontSize: 11, fontFamily: fonts.interMedium },
  selectedText: { color: colors.surface, fontFamily: fonts.interBold },
  emptyCard: { backgroundColor: colors.surface, borderColor: colors.mealReviewBorder, borderWidth: 1, borderRadius: 16, padding: 18, gap: 8, marginTop: 14 },
  emptyLabel: { color: colors.homePrimary, fontSize: 9, fontFamily: fonts.interBold },
});
