// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// This Code is generated with AI

import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../../components/AppButton";
import { FoodEditor } from "../../../components/FoodEditor";
import { ReviewProgressHeader } from "../components/ReviewProgressHeader";
import { colors } from "../../../util/colors";
import { fonts } from "../../../util/fonts";
import { abcCopyFor, copyFor } from "../../../util/strings";
import { AfterMealDifficultiesView } from "./AfterMealDifficultiesView";
import { AfterMealFollowUpView } from "./AfterMealFollowUpView";
import { AfterMealOutcomesView } from "./AfterMealOutcomesView";
import { AfterMealPhotoStepsView } from "./AfterMealPhotoStepsView";
import type { ReviewViewProps } from "./reviewViewTypes";

export function AfterMealReviewView(
  p: ReviewViewProps & { onHome: () => void },
) {
  const s = copyFor(p.language);
  const m = s.afterMealReview;
  const a = abcCopyFor(p.language);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const photoStep = [
    "photo",
    "preview",
    "compare",
    "comparing",
    "comparison-error",
  ].includes(p.draft.step);
  const phase =
    p.draft.step === "photo"
      ? 0
      : p.draft.step === "preview"
        ? 1
        : ["compare", "comparing", "comparison-error"].includes(p.draft.step)
          ? 2
          : p.draft.step === "outcomes"
            ? 3
            : 4;
  const goAfterDifficulties = () => p.onGo("suggestions");
  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ReviewProgressHeader
          title={m.titles[p.draft.step]}
          stacked={["outcomes", "difficulties"].includes(p.draft.step)}
          caption={`${p.childName} · ${p.meal.mealDate} · ${s.mealCheckin.types[p.meal.mealType]} · ${s.mealCheckin.settings[p.meal.setting]}`}
          backLabel={s.common.back}
          progress={phase}
          onBack={p.onBack}
          optional={p.draft.step === "difficulties" ? m.optional : undefined}
        />
        <Text
          accessibilityLiveRegion="polite"
          style={[
            styles.status,
            p.saveStatus === "error" && styles.statusError,
          ]}
        >
          {p.saveStatus === "saving"
            ? s.common.saving
            : p.saveStatus === "error"
              ? m.saveFailed
              : s.common.saved}
        </Text>
        {photoStep && p.saveStatus === "error" && (
          <View style={styles.retry}>
            <AppButton
              variant="meal"
              secondary
              label={s.common.retry}
              onPress={p.onRetrySave}
            />
          </View>
        )}
        <ScrollView
          pointerEvents={p.saving ? "none" : "auto"}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {photoStep && (
            <AfterMealPhotoStepsView
              p={{
                meal: p.meal,
                draft: p.draft,
                language: p.language,
                picking: p.picking,
                photoError: p.photoError,
                elapsedSeconds: p.elapsedSeconds,
                onPick: p.onPick,
                onRemovePhoto: p.onRemovePhoto,
                onFullPhoto: p.onFullPhoto,
                onImageError: p.onImageError,
                onCompare: p.onCompare,
                onCancelComparison: p.onCancelComparison,
                onManual: p.onManual,
                onGo: p.onGo,
              }}
            />
          )}
          {p.draft.step === "outcomes" && (
            <AfterMealOutcomesView
              p={{
                meal: p.meal,
                draft: p.draft,
                language: p.language,
                onSelectOutcome: p.onSelectOutcome,
                onToggleIngredient: p.onToggleIngredient,
                onEditFood: p.onEditFood,
                onRemoveFood: p.onRemoveFood,
                canContinueOutcomes: p.canContinueOutcomes,
                showUnanswered,
              }}
            />
          )}
          {p.draft.step === "difficulties" && (
            <AfterMealDifficultiesView
              p={{
                meal: p.meal,
                draft: p.draft,
                language: p.language,
                difficultyForms: p.difficultyForms,
                onDifficultyInput: p.onDifficultyInput,
                onAddDifficulty: p.onAddDifficulty,
                onRemoveDifficulty: p.onRemoveDifficulty,
              }}
            />
          )}
          {["goal", "suggestions", "complete"].includes(p.draft.step) && (
            <AfterMealFollowUpView
              p={{
                meal: p.meal,
                draft: p.draft,
                language: p.language,
                suggestionCards: p.suggestionCards,
                savedSuggestions: p.savedSuggestions,
                suggestionsLoading: p.suggestionsLoading,
                onGoalFeedback: p.onGoalFeedback,
                onSuggestionFeedback: p.onSuggestionFeedback,
                onNextSuggestion: p.onNextSuggestion,
                onRecommend: p.onRecommend,
                onBack: p.onBack,
                onHome: p.onHome,
              }}
            />
          )}
        </ScrollView>
        {["outcomes", "difficulties", "goal", "suggestions"].includes(
          p.draft.step,
        ) && (
          <View style={styles.footer}>
            {p.draft.step === "outcomes" && (
              <AppButton
                variant="meal"
                label={s.common.continue}
                onPress={() =>
                  p.canContinueOutcomes
                    ? p.onGo("difficulties")
                    : setShowUnanswered(true)
                }
                style={styles.pill}
              />
            )}
            {p.draft.step === "difficulties" && (
              <>
                <AppButton
                  variant="meal"
                  label={s.common.continue}
                  onPress={goAfterDifficulties}
                  style={styles.pill}
                />
                <AppButton
                  variant="meal"
                  secondary
                  label={m.skip}
                  onPress={goAfterDifficulties}
                  style={styles.pill}
                />
              </>
            )}
            {p.draft.step === "goal" && (
              <>
                <AppButton
                  variant="meal"
                  label={m.recordGoal}
                  disabled={!p.draft.goalFeedback}
                  onPress={() => p.onGo("suggestions")}
                  style={styles.pill}
                />
                <AppButton
                  variant="meal"
                  secondary
                  label={m.skip}
                  onPress={() => {
                    p.onGoalFeedback(null);
                    p.onGo("suggestions");
                  }}
                  style={styles.pill}
                />
              </>
            )}
            {p.draft.step === "suggestions" && (
              <AppButton
                variant="meal"
                label={p.saving ? a.savingReview : m.finish}
                disabled={p.saving || !p.canContinueOutcomes}
                onPress={p.onSave}
                style={styles.pill}
              />
            )}
            <Text accessibilityLiveRegion="polite" style={styles.status}>
              {p.saveStatus === "saving"
                ? s.common.saving
                : p.saveStatus === "error"
                  ? s.common.saveFailed
                  : s.common.saved}
            </Text>
            {p.saveStatus === "error" && (
              <AppButton
                variant="meal"
                secondary
                label={s.common.retry}
                onPress={p.onRetrySave}
              />
            )}
          </View>
        )}
        {p.draft.step !== "complete" && (
          <View style={styles.retry}>
            <Pressable
              accessibilityRole="button"
              disabled={p.saving}
              onPress={p.onSaveExit}
              style={{ alignItems: "center", padding: 12 }}
            >
              <Text style={{ color: colors.homePrimary, fontSize: 16 }}>
                {a.saveExit}
              </Text>
            </Pressable>
          </View>
        )}
        {p.editingFood && (
          <FoodEditor
            food={p.editingFood}
            finalLabels={a}
            labels={{ meal: s.mealCheckin, common: s.common }}
            traits={p.editingTraits}
            ingredient={p.ingredient}
            onIngredientChange={p.onIngredientChange}
            onAddIngredient={p.onAddIngredient}
            onRemoveIngredient={p.onRemoveIngredient}
            custom={p.customTrait}
            onCustomChange={p.onCustomTraitChange}
            onAddCustomTrait={p.onAddCustomTrait}
            onChange={p.onChangeFood}
            onSave={p.onSaveFood}
            onCancel={p.onCancelFoodEdit}
            onEditTraits={() => p.onSetTraits(p.editingFood!.traits)}
            onToggleTrait={p.onToggleTrait}
            onSaveTraits={p.onSaveTraits}
            onCancelTraits={() => p.onSetTraits(null)}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 26,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 9,
    paddingBottom: 10,
    gap: 7,
    backgroundColor: colors.homeBackground,
  },
  pill: { minHeight: 48, borderRadius: 999 },
  status: {
    color: colors.mealReviewMuted,
    fontSize: 8,
    fontFamily: fonts.interRegular,
    textAlign: "center",
  },
  statusError: { color: colors.error },
  mealCaption: {
    color: colors.mealReviewMuted,
    paddingHorizontal: 18,
    paddingBottom: 4,
    fontSize: 9,
    fontFamily: fonts.interMedium,
  },
  retry: { paddingHorizontal: 18, paddingBottom: 5 },
});
