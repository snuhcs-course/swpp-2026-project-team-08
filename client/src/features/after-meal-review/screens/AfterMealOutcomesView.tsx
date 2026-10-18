// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; corrected Figma audit details
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; revised manual after-meal flow
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
      <View style={styles.countRow}>
        <Text style={styles.count}>
          {m.itemCount(p.meal.foods.length)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={m.definitions}
          style={{ position: "absolute", right: 0, top: 0 }}
          onPress={() => setDefinitionsOpen(true)}
        >
          <UiAssetIcon name="outcome-help" />
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
              <View style={{ gap: 4 }}><View style={styles.heading}>
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
                onSelect={(value) => p.onSelectOutcome(food.id, value)}
              />
              </View>
              {!!outcome.ingredients.length && (
                <View style={{ gap: 5 }}>
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
                </View>
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
        label={a.addOutcomeFood}
        labelStyle={{ fontSize: 12, color: colors.homePrimary }}
        style={{ minHeight: 48 }}
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
    backgroundColor: colors.ingredientChip,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  selectedToken: { backgroundColor: colors.navy },
  tokenText: { color: colors.homeText, fontSize: 13, fontFamily: fonts.poppinsMedium },
  selectedTokenText: { color: colors.surface },
  heading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodName: {
    color: colors.homeText,
    fontSize: 14,
    fontFamily: fonts.poppinsSemiBold,
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
    fontFamily: fonts.poppinsMedium,
  },
  demo: {
    color: colors.suggestionText,
    backgroundColor: colors.suggestionSurface,
    borderRadius: 9,
    padding: 8,
    fontSize: 12,
    fontFamily: fonts.poppinsSemiBold,
  },
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 32,
  },
  count: { color: colors.homeText, fontSize: 11, fontFamily: fonts.poppinsSemiBold },
  help: { color: colors.homePrimary, fontSize: 17, paddingHorizontal: 5 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.mealReviewBorder,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 14,
  },
  edit: { alignSelf: "flex-end" },
  editText: {
    color: colors.homePrimary,
    fontSize: 12,
    fontFamily: fonts.poppinsSemiBold,
  },
  removeText: {
    color: colors.error,
    fontSize: 12,
    fontFamily: fonts.poppinsSemiBold,
  },
  error: { color: colors.error, fontSize: 10, fontFamily: fonts.interMedium },
});
