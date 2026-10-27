// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 식후 검토 글자 크기 및 가독성 개선

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { outcomeValues, type Outcome, type OutcomeDecision } from '../../../types/afterMealReview';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export function OutcomeChoiceRow({ label, decision, labels, ingredient = false, hideLabel = false, onSelect }: {
  label: string;
  decision: OutcomeDecision;
  labels: Record<Outcome, string>;
  ingredient?: boolean;
  hideLabel?: boolean;
  onSelect: (value: Outcome) => void;
}) {
  return (
    <View style={[styles.root, ingredient && styles.ingredient]}>
      {!!label && !hideLabel && <Text style={[styles.label, ingredient && styles.ingredientLabel]}>{label}</Text>}
      <View style={styles.options}>
        {outcomeValues.map((value) => {
          const confirmed = decision.confirmed === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: confirmed }}
              accessibilityLabel={`${label ? `${label}: ` : ''}${labels[value]}`}
              onPress={() => onSelect(value)}
              style={[styles.option, confirmed && styles.confirmed]}
            >
              <Text style={[styles.optionText, confirmed && styles.confirmedText]}>{labels[value]}</Text>
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
  label: { color: colors.homeText, fontFamily: fonts.interBold, fontSize: 16 },
  ingredientLabel: { width: 64, fontSize: 14, fontFamily: fonts.interMedium },
  options: { flexDirection: 'row', flexWrap: 'wrap', flex: 1, gap: 8 },
  option: { flexGrow: 1, flexBasis: '45%', minWidth: 0, minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: colors.mealReviewBorder, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  confirmed: { backgroundColor: colors.successSurface, borderColor: colors.success },
  suggested: { borderColor: colors.suggestionBorder, backgroundColor: colors.suggestionSurface },
  optionText: { color: colors.homeText, fontFamily: fonts.poppinsMedium, fontSize: 14, textAlign: 'center' },
  confirmedText: { color: colors.homeText, fontFamily: fonts.interBold },
  suggestedText: { color: colors.suggestionText, fontFamily: fonts.interBold, fontSize: 10, textTransform: 'uppercase' },
});
