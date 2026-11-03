// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Expandable food and ingredient reviews matching the reference design

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FoodOutcomeCard } from '../components/FoodOutcomeCard';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import type { ReviewViewProps } from './reviewViewTypes';

type Props = Pick<ReviewViewProps,
  'meal' | 'draft' | 'language' | 'childName' | 'onSelectOutcome' | 'onEditFood' |
  'canContinueOutcomes' | 'onToggleIngredient'
> & { showUnanswered: boolean };

export function AfterMealOutcomesView({ p }: { p: Props }) {
  const m = copyFor(p.language).afterMealReview;
  return <View style={styles.root}>
    <Text style={styles.count}>{m.itemCount(p.meal.foods.length)}</Text>
    {p.meal.foods.map(food => {
      const outcome = p.draft.outcomes.find(entry => entry.foodId === food.id);
      return outcome ? <FoodOutcomeCard key={food.id} food={food} outcome={outcome}
        language={p.language} childName={p.childName} onEdit={() => p.onEditFood(food)}
        onSelect={(value, ingredientId) => p.onSelectOutcome(food.id, value, ingredientId)}
        onToggleIngredient={id => p.onToggleIngredient(food.id, id)} /> : null;
    })}
    <Pressable accessibilityRole="button" onPress={() => p.onEditFood()} style={styles.addFood}>
      <Ionicons name="add" size={18} color={colors.homePrimary} />
      <Text style={styles.addLabel}>{m.addFood}</Text>
    </Pressable>
    {p.showUnanswered && !p.canContinueOutcomes && <Text accessibilityRole="alert" style={styles.error}>{m.unansweredHint}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  count: { color: colors.reviewHeading, fontSize: 14, fontFamily: fonts.interBold, marginTop: 10, marginBottom: 4 },
  addFood: { minHeight: 46, borderWidth: 1, borderStyle: 'dotted', borderColor: colors.reviewCardBorder, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  addLabel: { color: colors.homePrimary, fontFamily: fonts.interBold, fontSize: 13 },
  error: { color: colors.error, fontFamily: fonts.interMedium, fontSize: 14 },
});
