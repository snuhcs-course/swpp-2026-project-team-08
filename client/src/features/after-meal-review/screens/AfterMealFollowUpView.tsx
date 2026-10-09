// This Code is generated with AI

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { SuggestionCard } from '../../../components/SuggestionCard';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import type { ReviewViewProps } from './reviewViewTypes';

type Props = Pick<ReviewViewProps,
  'meal' | 'draft' | 'language' | 'suggestionCards' | 'savedSuggestions' | 'suggestionsLoading' |
  'onGoalFeedback' | 'onSuggestionFeedback' | 'onNextSuggestion' | 'onRecommend' | 'onBack'> & { onHome: () => void };

export function AfterMealFollowUpView({ p }: { p: Props }) {
  const s = copyFor(p.language);
  const m = s.afterMealReview;
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
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{m.titles.complete}</Text>
      <Text style={styles.muted}>{m.saved}</Text>
      <AppButton variant="meal" label={m.recommendedNext} onPress={p.onRecommend} />
      {p.savedSuggestions[0] && (
        <AppButton variant="meal" secondary label={m.nextSuggestion} onPress={() => p.onNextSuggestion(p.savedSuggestions[0].id)} />
      )}
      <AppButton variant="meal" label={s.common.home} onPress={p.onHome} />
    </View>
  );
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
