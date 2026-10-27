// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 식후 검토 글자 확대·하단 공통화 및 전체 흐름 버튼 디자인 통일

import { topBarStyles } from '../../../components/AppHeader';
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MealSaveStatusView } from "../../../components/MealSaveStatusView";
import { MealFlowButton } from "../../../components/MealFlowButton";
import { MealFlowFooter } from "../../../components/MealFlowFooter";
import { MealTextButton } from "../../../components/MealTextButton";
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
        {p.draft.step === "photo" && p.saveStatus === "error" && (
          <View style={styles.retry}>
            <MealTextButton
              label={s.common.retry}
              onPress={p.onRetrySave}
            />
          </View>
        )}
        <ScrollView
          pointerEvents={p.saving ? "none" : "auto"}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, p.draft.step === "difficulties" && { paddingHorizontal: 24 }]}
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
        {["preview", "compare", "outcomes", "difficulties"].includes(
          p.draft.step,
        ) && (
          <MealFlowFooter style={p.draft.step === "difficulties" ? { backgroundColor: colors.difficultyBackground } : undefined}>
            {p.draft.step === "preview" && (
              <MealFlowButton
                label={m.usePhoto}
                disabled={p.saving || !p.draft.afterPhoto || !!p.photoError}
                onPress={() => p.meal.photo ? p.onGo("compare") : p.onManual()}
              />
            )}
            {p.draft.step === "compare" && (
              <MealFlowButton label={m.manual} disabled={p.saving} onPress={p.onManual} />
            )}
            {p.draft.step === "outcomes" && (
              <MealFlowButton
                label={s.common.continue}
                disabled={!p.canContinueOutcomes}
                onPress={() =>
                  p.canContinueOutcomes
                    ? p.onGo("difficulties")
                    : setShowUnanswered(true)
                }
              />
            )}
            {p.draft.step === "difficulties" && (
              <>
                <MealFlowButton
                  label={s.common.continue}
                  disabled={p.saving || !p.canContinueOutcomes}
                  onPress={goAfterDifficulties}
                />
                <MealTextButton
                  label={m.skip}
                  disabled={p.saving || !p.canContinueOutcomes}
                  onPress={goAfterDifficulties}
                />
              </>
            )}
            {["compare", "outcomes"].includes(p.draft.step) || (p.draft.step === "preview" && !!p.meal.photo) ? (
              <MealTextButton label={a.saveExit} disabled={p.saving} onPress={p.onSaveExit} />
            ) : null}
            {p.saveStatus !== "saved" && <Text accessibilityLiveRegion="polite" style={styles.status}>
              {p.saveStatus === "saving"
                ? s.common.saving
                : p.saveStatus === "error"
                  ? s.common.saveFailed
                  : s.common.saved}
            </Text>}
            {p.saveStatus === "error" && (
              <MealTextButton
                label={s.common.retry}
                onPress={p.onRetrySave}
              />
            )}
          </MealFlowFooter>
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
    ...topBarStyles.content,
    paddingBottom: 26,
    flexGrow: 1,
  },
  status: {
    color: colors.mealReviewMuted,
    fontSize: 12,
    fontFamily: fonts.interRegular,
    textAlign: "center",
  },
  statusError: { color: colors.error },
  mealCaption: {
    color: colors.mealReviewMuted,
    paddingHorizontal: 24,
    paddingBottom: 4,
    fontSize: 14,
    fontFamily: fonts.interMedium,
  },
  retry: { paddingHorizontal: 24, paddingBottom: 5 },
});
