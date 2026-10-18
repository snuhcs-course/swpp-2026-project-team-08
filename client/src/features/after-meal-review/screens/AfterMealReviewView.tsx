// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
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
import { MealSaveStatusView } from "../../../components/MealSaveStatusView";
import { AppButton } from "../../../components/AppButton";
import { MealFoodEditorDialog } from "../../../components/MealFoodEditorDialog";
import { ReviewProgressHeader } from "../components/ReviewProgressHeader";
import { colors } from "../../../util/colors";
import { displayDate } from '../../../util/date';
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
  const [savePanelHidden, setSavePanelHidden] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const photoStep = [
    "photo",
    "preview",
    "compare",
  ].includes(p.draft.step);
  const phase =
    p.draft.step === "photo"
      ? 0
      : p.draft.step === "preview"
        ? 1
        : ["compare", "comparing", "comparison-error"].includes(p.draft.step)
          ? 3
          : p.draft.step === "outcomes"
            ? 3
            : 4;
  const goAfterDifficulties = () => {
    if (p.saving || !p.canContinueOutcomes) return;
    setSavePanelHidden(false);
    p.onSave();
  };
  if (!savePanelHidden && p.draft.step !== 'complete' && (p.saving || p.finalSaveState === 'error')) return <MealSaveStatusView review
    status={p.saving ? 'saving' : 'error'} language={p.language}
    photos={[p.meal.photo?.uri, p.draft.afterPhoto?.uri].filter((uri): uri is string => !!uri)}
    mealDate={p.meal.mealDate} mealType={p.meal.mealType} foods={p.meal.foods}
    onRetry={p.onSave} onSaveExit={p.onSaveExit} onReturn={() => setSavePanelHidden(true)} />;

  return (
    <SafeAreaView style={[styles.root, p.draft.step === "compare" && { backgroundColor: colors.homeBackground }, p.draft.step === "difficulties" && { backgroundColor: colors.difficultyBackground }]} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ReviewProgressHeader
          title={p.draft.step === "complete" ? a.reviewSavedHeader : m.titles[p.draft.step]}
          stacked={["outcomes", "difficulties"].includes(p.draft.step)}
          caption={p.draft.step === "preview" && !p.meal.photo ? a.draftFor(p.childName) : !["outcomes", "preview"].includes(p.draft.step) ? undefined : `${p.childName} · ${displayDate(p.meal.mealDate, p.language)} · ${s.mealCheckin.types[p.meal.mealType]} · ${s.mealCheckin.settings[p.meal.setting]}`}
          backLabel={s.common.back}
          progress={p.draft.step === "outcomes" ? 0 : phase}
          hideProgress={p.draft.step === "difficulties"}
          onBack={p.onBack}
          disabled={p.saving}
          optional={p.draft.step === "difficulties" ? m.optional : undefined}
        />
        {p.saveStatus !== "saved" && <Text
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
        </Text>}
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
          contentContainerStyle={[styles.content, p.draft.step === "difficulties" && { paddingHorizontal: 18 }]}
        >
          {photoStep && (
            <AfterMealPhotoStepsView
              p={{
                meal: p.meal,
                draft: p.draft,
                language: p.language,
                picking: p.picking,
                photoError: p.photoError,
                onPick: p.onPick,
                onRemovePhoto: p.onRemovePhoto,
                onFullPhoto: p.onFullPhoto,
                onImageError: p.onImageError,
                onManual: p.onManual,
                onGo: p.onGo,
                onSaveExit: p.onSaveExit,
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
          {p.draft.step === "complete" && (
            <AfterMealFollowUpView
              p={{
                meal: p.meal,
                draft: p.draft,
                language: p.language,
                onRecommend: p.onRecommend,
                onHome: p.onHome,
              }}
            />
          )}
        </ScrollView>
        {["outcomes", "difficulties"].includes(
          p.draft.step,
        ) && (
          <View style={[styles.footer, p.draft.step === "difficulties" && { paddingHorizontal: 18, backgroundColor: colors.difficultyBackground }]}>
            {p.draft.step === "outcomes" && (
              <AppButton
                variant="meal"
                label={s.common.continue}
                disabled={!p.canContinueOutcomes}
                onPress={() =>
                  p.canContinueOutcomes
                    ? p.onGo("difficulties")
                    : setShowUnanswered(true)
                }
                style={[styles.pill, { minHeight: 52, borderRadius: 14, marginHorizontal: 24 }]}
                labelStyle={{ fontSize: 16 }}
              />
            )}
            {p.draft.step === "difficulties" && (
              <>
                <AppButton
                  variant="meal"
                  label={s.common.continue}
                  disabled={p.saving || !p.canContinueOutcomes}
                  onPress={goAfterDifficulties}
                  style={styles.pill}
                />
                <AppButton
                  variant="meal"
                  secondary
                  label={m.skip}
                  disabled={p.saving || !p.canContinueOutcomes}
                  onPress={goAfterDifficulties}
                  labelStyle={{ fontSize: 16, color: colors.reviewHeading, fontFamily: fonts.interBold }}
                  style={[styles.pill, { borderWidth: 0, backgroundColor: colors.transparent }]}
                />
              </>
            )}
            {p.saveStatus !== "saved" && <Text accessibilityLiveRegion="polite" style={styles.status}>
              {p.saveStatus === "saving"
                ? s.common.saving
                : p.saveStatus === "error"
                  ? s.common.saveFailed
                  : s.common.saved}
            </Text>}
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
        {!["complete", "difficulties", "photo"].includes(p.draft.step) && (p.draft.step !== "preview" || !!p.meal.photo) && (
          <View style={styles.retry}>
            <Pressable
              accessibilityRole="button"
              disabled={p.saving}
              onPress={p.onSaveExit}
              style={{ alignItems: "center", padding: 12 }}
            >
              <Text style={{ color: colors.homePrimary, fontSize: p.draft.step === "compare" ? 14 : 16, fontFamily: fonts.poppinsSemiBold }}>
                {p.draft.step === "outcomes" ? s.common.saveExit : a.saveExit}
              </Text>
            </Pressable>
          </View>
        )}
        {p.editingFood && (
          <MealFoodEditorDialog
            food={p.editingFood}
            mode={p.meal.foods.some((item) => item.id === p.editingFood?.id) ? 'edit' : 'add'}
            labels={a}
            meal={s.mealCheckin}
            common={s.common}
            ingredient={p.ingredient}
            onIngredientChange={p.onIngredientChange}
            onAddIngredient={p.onAddIngredient}
            onRemoveIngredient={p.onRemoveIngredient}
            onChange={p.onChangeFood}
            onSave={p.onSaveFood}
            onCancel={p.onCancelFoodEdit}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.afterMealBackground },
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
    backgroundColor: colors.afterMealBackground,
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
