// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// This Code is generated with AI

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { UiAssetIcon } from "../../../components/UiAssetIcon";
import { AppButton } from "../../../components/AppButton";
import { OutcomeChoiceRow } from "../components/OutcomeChoiceRow";
import { OutcomeDefinitionsModal } from "../components/OutcomeDefinitionsModal";
import { colors } from "../../../util/colors";
import { fonts } from "../../../util/fonts";
import { abcCopyFor, copyFor } from "../../../util/strings";
import type { ReviewViewProps } from "./reviewViewTypes";

type Props = Pick<
  ReviewViewProps,
  | "meal"
  | "draft"
  | "language"
  | "onSelectOutcome"
  | "onEditFood"
  | "onRemoveFood"
  | "canContinueOutcomes"
  | "onToggleIngredient"
> & {
  showUnanswered: boolean;
};

export function AfterMealOutcomesView({ p }: { p: Props }) {
  const s = copyFor(p.language);
  const m = s.afterMealReview;
  const a = abcCopyFor(p.language);
  const [definitionsOpen, setDefinitionsOpen] = useState(false);
  return (
    <View style={styles.root}>
      {p.draft.comparisonMethod === "ai" && (
        <Text style={styles.intro}>{m.outcomeIntro}</Text>
      )}
      {p.draft.comparisonMethod === "ai" && (
        <Text style={styles.demo}>{m.demo}</Text>
      )}
      <View style={styles.countRow}>
        <Text style={styles.count}>
          {m.itemCount(p.meal.foods.length).toLocaleUpperCase()}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={m.definitions}
          onPress={() => setDefinitionsOpen(true)}
        >
          <Text style={styles.help}>ⓘ</Text>
        </Pressable>
      </View>
      {p.meal.foods.map((food) => {
        const outcome = p.draft.outcomes.find(
          (entry) => entry.foodId === food.id,
        );
        if (!outcome) return null;
        return (
          <View key={food.id} style={{ gap: 12 }}>
            <View style={styles.card}>
              <View style={styles.heading}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => p.onEditFood(food)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Text style={styles.editText}>{s.common.edit}</Text>
                    <UiAssetIcon name="abc-edit" />
                  </View>
                </Pressable>
              </View>
              <OutcomeChoiceRow
                label={food.name}
                hideLabel
                decision={outcome.decision}
                labels={m.outcomes}
                suggestedLabel={m.suggestion}
                onSelect={(value) => p.onSelectOutcome(food.id, value)}
              />
              {!!outcome.ingredients.length && (
                <>
                  <Text style={styles.intro}>{a.selectIngredients}</Text>
                  <View style={styles.tokens}>
                    {outcome.ingredients.map((ingredient) => (
                      <Pressable
                        key={ingredient.id}
                        accessibilityRole="checkbox"
                        accessibilityState={{
                          checked: ingredient.selected !== false,
                        }}
                        onPress={() =>
                          p.onToggleIngredient(food.id, ingredient.id)
                        }
                        style={[
                          styles.token,
                          ingredient.selected !== false && styles.selectedToken,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tokenText,
                            ingredient.selected !== false &&
                              styles.selectedTokenText,
                          ]}
                        >
                          {ingredient.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>
            {outcome.ingredients
              .filter((ingredient) => ingredient.selected !== false)
              .map((ingredient) => (
                <View key={ingredient.id} style={styles.card}>
                  <OutcomeChoiceRow
                    label={a.ingredientIn(ingredient.name, food.name)}
                    decision={ingredient.decision}
                    labels={m.outcomes}
                    suggestedLabel={m.suggestion}
                    onSelect={(value) =>
                      p.onSelectOutcome(food.id, value, ingredient.id)
                    }
                  />
                </View>
              ))}
          </View>
        );
      })}
      <AppButton
        variant="meal"
        secondary
        label={s.mealCheckin.addFood}
        onPress={() => p.onEditFood()}
      />
      {p.showUnanswered && !p.canContinueOutcomes && (
        <Text accessibilityRole="alert" style={styles.error}>
          {m.unansweredHint}
        </Text>
      )}
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
  tokens: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  token: {
    borderRadius: 999,
    backgroundColor: colors.calendarEmpty,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  selectedToken: { backgroundColor: colors.navy },
  tokenText: { color: colors.homeText, fontSize: 13 },
  selectedTokenText: { color: colors.surface },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodName: {
    color: colors.homeText,
    fontSize: 14,
    fontFamily: fonts.interBold,
  },
  root: { gap: 11 },
  title: {
    color: colors.homeText,
    fontSize: 19,
    lineHeight: 23,
    fontFamily: fonts.poppinsSemiBold,
  },
  intro: {
    color: colors.mealReviewMuted,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.interRegular,
  },
  demo: {
    color: colors.suggestionText,
    backgroundColor: colors.suggestionSurface,
    borderRadius: 9,
    padding: 8,
    fontSize: 9,
    fontFamily: fonts.interMedium,
  },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  count: { color: colors.homeText, fontSize: 10, fontFamily: fonts.interBold },
  help: { color: colors.homePrimary, fontSize: 17, paddingHorizontal: 5 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.mealReviewBorder,
    borderRadius: 15,
    padding: 10,
    gap: 9,
  },
  edit: { alignSelf: "flex-end" },
  editText: {
    color: colors.homePrimary,
    fontSize: 9,
    fontFamily: fonts.interMedium,
  },
  removeText: {
    color: colors.error,
    fontSize: 9,
    fontFamily: fonts.interMedium,
  },
  error: { color: colors.error, fontSize: 10, fontFamily: fonts.interMedium },
});
