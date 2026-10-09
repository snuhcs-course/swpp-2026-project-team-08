// This Code is generated with AI

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { outcomeValues, type Outcome, type OutcomeDecision } from '../../../types/afterMealReview';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export function OutcomeChoiceRow({ label, decision, labels, suggestedLabel, ingredient = false, onSelect }: {
  label: string;
  decision: OutcomeDecision;
  labels: Record<Outcome, string>;
  suggestedLabel: string;
  ingredient?: boolean;
  onSelect: (value: Outcome) => void;
}) {
  return (
    <View style={[styles.root, ingredient && styles.ingredient]}>
      <Text style={[styles.label, ingredient && styles.ingredientLabel]} numberOfLines={2}>{label}</Text>
      <View style={styles.options}>
        {outcomeValues.map((value) => {
          const confirmed = decision.confirmed === value;
          const suggested = !decision.confirmed && decision.suggested === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: confirmed }}
              accessibilityLabel={`${label}: ${labels[value]}${suggested ? `, ${suggestedLabel}` : ''}`}
              onPress={() => onSelect(value)}
              style={[styles.option, confirmed && styles.confirmed, suggested && styles.suggested]}
            >
              <Text style={[styles.optionText, confirmed && styles.confirmedText]} numberOfLines={2}>{labels[value]}</Text>
              {suggested && <Text style={styles.suggestedText}>{suggestedLabel}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 7 },
  ingredient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8 },
  label: { color: colors.homeText, fontFamily: fonts.interBold, fontSize: 12 },
  ingredientLabel: { width: 64, fontSize: 9, fontFamily: fonts.interMedium },
  options: { flexDirection: 'row', flex: 1, gap: 4 },
  option: { flex: 1, minHeight: 35, borderRadius: 8, borderWidth: 1, borderColor: colors.mealReviewBorder, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  confirmed: { backgroundColor: colors.navy, borderColor: colors.navy },
  suggested: { borderColor: colors.suggestionBorder, backgroundColor: colors.suggestionSurface },
  optionText: { color: colors.homeText, fontFamily: fonts.interMedium, fontSize: 8, textAlign: 'center' },
  confirmedText: { color: colors.surface, fontFamily: fonts.interBold },
  suggestedText: { color: colors.suggestionText, fontFamily: fonts.interBold, fontSize: 6, textTransform: 'uppercase' },
});
