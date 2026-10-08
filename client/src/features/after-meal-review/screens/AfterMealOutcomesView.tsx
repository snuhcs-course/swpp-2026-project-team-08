import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { OutcomeChoiceRow } from '../components/OutcomeChoiceRow';
import { OutcomeDefinitionsModal } from '../components/OutcomeDefinitionsModal';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import type { ReviewViewProps } from './reviewViewTypes';

type Props = Pick<ReviewViewProps, 'meal' | 'draft' | 'language' | 'onSelectOutcome' | 'onEditFood' | 'onRemoveFood' | 'canContinueOutcomes'> & {
  showUnanswered: boolean;
};

export function AfterMealOutcomesView({ p }: { p: Props }) {
  const s = copyFor(p.language);
  const m = s.afterMealReview;
  const [definitionsOpen, setDefinitionsOpen] = useState(false);
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{m.titles.outcomes}</Text>
      <Text style={styles.intro}>{m.outcomeIntro}</Text>
      {p.draft.comparisonMethod === 'ai' && <Text style={styles.demo}>{m.demo}</Text>}
      <View style={styles.countRow}>
        <Text style={styles.count}>{m.itemCount(p.meal.foods.length).toLocaleUpperCase()}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={m.definitions} onPress={() => setDefinitionsOpen(true)}>
          <Text style={styles.help}>ⓘ</Text>
        </Pressable>
      </View>
      {p.meal.foods.map((food) => {
        const outcome = p.draft.outcomes.find((entry) => entry.foodId === food.id);
        if (!outcome) return null;
        return (
          <View key={food.id} style={styles.card}>
            <OutcomeChoiceRow
              label={food.name}
              decision={outcome.decision}
              labels={m.outcomes}
              suggestedLabel={m.suggestion}
              onSelect={(value) => p.onSelectOutcome(food.id, value)}
            />
            {outcome.ingredients.map((ingredient) => (
              <OutcomeChoiceRow
                key={ingredient.id}
                label={ingredient.name}
                ingredient
                decision={ingredient.decision}
                labels={m.outcomes}
                suggestedLabel={m.suggestion}
                onSelect={(value) => p.onSelectOutcome(food.id, value, ingredient.id)}
              />
            ))}
            <Pressable accessibilityRole="button" onPress={() => p.onEditFood(food)} style={styles.edit}>
              <Text style={styles.editText}>{m.editInfo} ↗</Text>
            </Pressable>
            {p.meal.foods.length > 1 && (
              <Pressable accessibilityRole="button" onPress={() => p.onRemoveFood(food.id)} style={styles.edit}>
                <Text style={styles.removeText}>{s.common.remove}</Text>
              </Pressable>
            )}
          </View>
        );
      })}
      <AppButton variant="meal" secondary label={s.mealCheckin.addFood} onPress={() => p.onEditFood()} />
      {p.showUnanswered && !p.canContinueOutcomes && <Text accessibilityRole="alert" style={styles.error}>{m.unansweredHint}</Text>}
      <OutcomeDefinitionsModal
        visible={definitionsOpen}
        title={m.definitions}
        intro={m.definitionsIntro}
        labels={m.outcomes}
        descriptions={m.outcomeDescriptions}
        unansweredLabel={m.unanswered}
        gotIt={m.gotIt}
        onClose={() => setDefinitionsOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 11 },
  title: { color: colors.homeText, fontSize: 19, lineHeight: 23, fontFamily: fonts.poppinsSemiBold },
  intro: { color: colors.mealReviewMuted, fontSize: 10, lineHeight: 15, fontFamily: fonts.interRegular },
  demo: { color: colors.suggestionText, backgroundColor: colors.suggestionSurface, borderRadius: 9, padding: 8, fontSize: 9, fontFamily: fonts.interMedium },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  count: { color: colors.homeText, fontSize: 10, fontFamily: fonts.interBold },
  help: { color: colors.homePrimary, fontSize: 17, paddingHorizontal: 5 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.mealReviewBorder, borderRadius: 15, padding: 10, gap: 9 },
  edit: { alignSelf: 'flex-end' },
  editText: { color: colors.homePrimary, fontSize: 9, fontFamily: fonts.interMedium },
  removeText: { color: colors.error, fontSize: 9, fontFamily: fonts.interMedium },
  error: { color: colors.error, fontSize: 10, fontFamily: fonts.interMedium },
});
