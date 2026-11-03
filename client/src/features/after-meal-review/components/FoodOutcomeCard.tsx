// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Expandable food reviews with optional ingredient cards

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FoodItem } from '../../../types/meal';
import type { FoodOutcome, Outcome } from '../../../types/afterMealReview';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import { MealOutcomeSlider } from './MealOutcomeSlider';

export function FoodOutcomeCard({ food, outcome, language, childName, onEdit, onSelect, onToggleIngredient }: {
  food: FoodItem;
  outcome: FoodOutcome;
  language: Language;
  childName: string;
  onEdit: () => void;
  onSelect: (value: Outcome, ingredientId?: string) => void;
  onToggleIngredient: (id: string) => void;
}) {
  const s = copyFor(language);
  const m = s.afterMealReview;
  const [expanded, setExpanded] = useState((!outcome.decision.confirmed || outcome.decision.confirmed === 'unclear') || outcome.ingredients.some(i => i.selected !== false && !i.decision.confirmed));
  const selected = outcome.ingredients.filter(i => i.selected !== false);
  return <View style={styles.group}>
    <View style={styles.card}>
      <View style={styles.heading}>
        <Pressable accessibilityRole="button" accessibilityLabel={m.toggleFood(food.name)}
          accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={styles.summary}>
          {!expanded && <Ionicons name="chevron-down" size={21} color={colors.editorPlaceholder} />}
          <View style={styles.nameBlock}>
            <Text style={styles.foodName}>{food.name}</Text>
            <Text style={styles.summaryText}>{m.foodSummary(outcome.ingredients.length, selected.length)}</Text>
          </View>
        </Pressable>
        {expanded ? <Pressable accessibilityRole="button" accessibilityLabel={s.common.edit}
          onPress={onEdit} hitSlop={6} style={styles.iconButton}>
          <Ionicons name="pencil-outline" size={21} color={colors.homePrimary} />
        </Pressable> : outcome.decision.confirmed && <Text style={styles.badge}>{m.outcomes[outcome.decision.confirmed]}</Text>}
      </View>
      {expanded && <>
        <View style={styles.questionBlock}>
          <Text style={styles.question}>{m.amountQuestion(childName)}</Text>
          <Text style={styles.hint}>{m.amountHint}</Text>
        </View>
        <MealOutcomeSlider value={outcome.decision.confirmed} label={food.name} labels={m.outcomes}
          unsetLabel={m.unanswered} onSelect={value => onSelect(value)} />
        {!!outcome.ingredients.length && <View style={styles.ingredients}>
          <View style={styles.heading}>
            <Text style={styles.sectionTitle}>{m.reviewIngredients}</Text>
            <Text style={styles.optional}>{m.optional}</Text>
          </View>
          <Text style={styles.hint}>{m.reviewIngredientsHint}</Text>
          <View style={styles.tokens}>
            {outcome.ingredients.map(ingredient => <Pressable key={ingredient.id} accessibilityRole="checkbox"
              accessibilityLabel={ingredient.name} accessibilityState={{ checked: ingredient.selected !== false }}
              onPress={() => onToggleIngredient(ingredient.id)}
              style={[styles.token, ingredient.selected !== false && styles.selectedToken]}>
              <Ionicons name="add" size={15} color={ingredient.selected !== false ? colors.homePrimary : colors.reviewMuted} />
              <Text style={[styles.tokenText, ingredient.selected !== false && styles.selectedTokenText]}>{ingredient.name}</Text>
            </Pressable>)}
          </View>
        </View>}
      </>}
    </View>
    {expanded && selected.map(ingredient => <View key={ingredient.id} style={styles.card}>
      <View style={styles.heading}>
        <View style={styles.ingredientHeading}>
          <Text style={styles.foodName}>{ingredient.name}</Text>
          <Text style={styles.hint}>{m.ingredientContext(food.name)}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={m.removeIngredientReview(ingredient.name)}
          onPress={() => onToggleIngredient(ingredient.id)} hitSlop={6} style={styles.iconButton}>
          <Ionicons name="close" size={19} color={colors.reviewMuted} />
        </Pressable>
      </View>
      <MealOutcomeSlider value={ingredient.decision.confirmed} label={ingredient.name}
        labels={m.outcomes} unsetLabel={m.unanswered} onSelect={value => onSelect(value, ingredient.id)} />
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  group: { gap: 11 },
  card: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.reviewCardBorder, backgroundColor: colors.surface, gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  summary: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 20, minHeight: 32 },
  nameBlock: { flex: 1, gap: 4 },
  foodName: { fontSize: 16, lineHeight: 21, fontFamily: fonts.interBold, color: colors.reviewHeading },
  summaryText: { fontSize: 10, lineHeight: 14, fontFamily: fonts.interRegular, color: colors.reviewMuted },
  iconButton: { minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  badge: { overflow: 'hidden', borderRadius: 8, padding: 5, backgroundColor: colors.homeSelected, color: colors.homePrimary, fontFamily: fonts.interBold, fontSize: 12 },
  questionBlock: { gap: 6, marginTop: 4 },
  question: { color: colors.reviewHeading, fontFamily: fonts.interBold, fontSize: 16, lineHeight: 22 },
  hint: { color: colors.reviewMuted, fontFamily: fonts.interRegular, fontSize: 11, lineHeight: 16 },
  ingredients: { borderTopWidth: 1, borderColor: colors.homeBorder, marginTop: 8, paddingTop: 20, gap: 8, paddingBottom: 12 },
  sectionTitle: { color: colors.reviewHeading, fontFamily: fonts.interBold, fontSize: 14 },
  optional: { overflow: 'hidden', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 3, backgroundColor: colors.foodIngredientBackground, color: colors.reviewMuted, fontFamily: fonts.interBold, fontSize: 9 },
  tokens: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 },
  token: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.reviewCardBorder, borderRadius: 11, minHeight: 36, paddingHorizontal: 11, maxWidth: '100%' },
  selectedToken: { backgroundColor: colors.homeSelected, borderColor: colors.homePrimary },
  tokenText: { flexShrink: 1, color: colors.reviewLabel, fontFamily: fonts.interMedium, fontSize: 12 },
  selectedTokenText: { color: colors.homePrimary },
  ingredientHeading: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
});
