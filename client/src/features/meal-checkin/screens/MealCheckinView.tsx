// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 식사 정보·재료 입력·하단 UI 조정 및 현재 단계별 진행 표시
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화

import { AppHeader } from '../../../components/AppHeader';
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../../components/AppButton";
import { MealFlowFooter } from "../../../components/MealFlowFooter";
import { MealFlowButton } from "../../../components/MealFlowButton";
import { MealTextButton } from "../../../components/MealTextButton";
import { UiAssetIcon } from "../../../components/UiAssetIcon";
import { MealFoodEditorDialog } from "../../../components/MealFoodEditorDialog";
import { formStyles as ui } from "../../../components/formStyles";
import { abcCopyFor, copyFor, suggestionCopyFor } from "../../../util/strings";
import { MealCompleteStepView } from "./MealCompleteStepView";
import { MealDetailsStepView } from "./MealDetailsStepView";
import { MealFoodsStepView } from "./MealFoodsStepView";
import { MealSaveStatusView } from "../../../components/MealSaveStatusView";
import { Dialog } from "../../../components/Dialog";
import { MealPrivacySheetView } from "./MealPrivacySheetView";
import { MealPhotoStepsView } from "./MealPhotoStepsView";
import type { MealCheckinViewProps } from "./mealCheckinViewTypes";
import { styles } from "./mealCheckinStyles";

export function MealCheckinView(p: MealCheckinViewProps) {
  const d = p.draft;
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  const [savePanelHidden, setSavePanelHidden] = useState(false);
  const [replaceConfirm, setReplaceConfirm] = useState(false);
  const a = abcCopyFor(p.language);
  const [replace, setReplace] = useState(false);
  const [imageError, setImageError] = useState(false);
  const review = d.step === "foods";
  const emptyManual = review && !d.photo && !d.foods.length && !p.removedName;
  const photoStep = [
    "photo",
    "preview",
  ].includes(d.step);
  const segment = {
    details: 0,
    photo: 1,
    preview: 2,
    method: 3,
    analyzing: 3,
    "analysis-error": 3,
    foods: 3,
    complete: 4,
  }[d.step];

  if (!savePanelHidden && d.step !== 'complete' && (p.saving || p.error === 'save')) return <MealSaveStatusView
    status={p.saving ? 'saving' : 'error'} language={p.language} photos={d.photo ? [d.photo.uri] : []}
    mealDate={d.mealDate} mealType={d.mealType} foods={d.foods} onRetry={p.onConfirm} onSaveExit={p.onSaveExit}
    onReturn={() => setSavePanelHidden(true)} />;

  return (
    <SafeAreaView
      style={[
        styles.root,
        d.step === "photo" && styles.photoRoot,
        review && styles.reviewRoot,
      ]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <AppHeader title={emptyManual ? m.addFoodsTitle : d.step === 'complete' ? a.mealCheckinHeader : m.titles[d.step]} backLabel={s.common.back} onBack={p.onBack} disabled={p.saving} />
        <View style={{ flex: 1 }} pointerEvents={p.saving ? "none" : "auto"}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              d.step === "photo" && styles.photoContent,
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {d.step === 'preview' && <Text style={styles.headerNote}>{m.draftLabel}</Text>}
            {p.tryingSuggestion && d.step !== 'complete' && <Pressable
              accessibilityRole="checkbox" accessibilityState={{ checked: p.tryingSuggestion.checked }}
              disabled={p.saving} onPress={p.tryingSuggestion.onToggle} style={styles.header}>
              <Text style={ui.text}>{p.tryingSuggestion.checked ? '☑' : '☐'} {suggestionCopyFor(p.language).trying}</Text>
            </Pressable>}
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 1, max: 5, now: segment + 1 }}
              style={styles.progress}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.segment,
                    d.step === "photo" && styles.photoSegment,
                    i <= segment && styles.activeSegment,
                  ]}
                />
              ))}
            </View>
            {review && !emptyManual && (
              <View style={styles.reviewIntro}>
                <Text style={styles.reviewIntroTitle}>
                  {m.foodCount(d.foods.length)}
                </Text>
              </View>
            )}
            {d.step === "details" && (
              <View style={styles.mealDetailViewColumn}>
                <MealDetailsStepView
                  p={{
                    draft: d,
                    language: p.language,
                    dateInput: p.dateInput,
                    onUpdate: p.onUpdate,
                  }}
                />
                <AppButton
                  variant="meal"
                  label={m.toPhoto}
                  icon={<UiAssetIcon name="meal-arrow-right" />}
                  disabled={!d.mealType || !d.setting}
                  onPress={() => p.onGo("photo")}
                />
              </View>
            )}
            {photoStep && (
              <MealPhotoStepsView
                p={{
                  draft: d,
                  language: p.language,
                  picking: p.picking,
                  onFullPhoto: p.onFullPhoto,
                  onGo: p.onGo,
                  onSheet: p.onSheet,
                  onSaveExit: p.onSaveExit,
                }}
                replace={replace}
                imageError={imageError}
                onCloseReplace={() => setReplace(false)}
                onReplace={() => {
                  if (d.photo && (d.foods.length || d.suggestionLinks?.length))
                    setReplaceConfirm(true);
                  else setReplace((value) => !value);
                }}
                onImageError={() => setImageError(true)}
                onPick={(source) => {
                  setImageError(false);
                  setReplace(false);
                  p.onPick(source);
                }}
                onRemovePhoto={() => {
                  setImageError(false);
                  p.onRemovePhoto();
                }}
              />
            )}
            {review && (
              <MealFoodsStepView
                p={{
                  draft: d,
                  childName: p.childName,
                  language: p.language,
                  onEdit: p.onEdit,
                  onRemove: p.onRemove,
                  onGo: p.onGo,
                  onFullPhoto: p.onFullPhoto,
                  onConfirmFood: p.onConfirmFood,
                  removedName: p.removedName,
                  onUndoRemove: p.onUndoRemove,
                  suggestions: p.suggestions,
                  suggestionLinking: p.suggestionLinking,
                  suggestionsLoading: p.suggestionsLoading,
                  suggestionsError: p.suggestionsError,
                  onRetrySuggestions: p.onRetrySuggestions,
                }}
              />
            )}
            {d.step === "complete" && (
              <MealCompleteStepView
                p={{
                  draft: d,
                  language: p.language,
                  onAfterMeal: p.onAfterMeal,
                  onHome: p.onHome,
                }}
              />
            )}
            {(p.error || imageError || p.languageError) && (
              <Text accessibilityRole="alert" style={ui.error}>
                {p.error === "save"
                  ? m.saveFailed
                  : p.error === "permission"
                    ? m.permission
                    : p.error === "image" || imageError
                      ? m.imageError
                      : s.common.saveFailed}
              </Text>
            )}
          </ScrollView>
        </View>
        {(["photo", "preview", "foods"] as string[]).includes(d.step) && (
          <MealFlowFooter>
            {d.step === "preview" && (
              <AppButton
                variant="meal"
                label={m.addFood}
                icon={<UiAssetIcon name="meal-check" />}
                disabled={!d.photo || imageError || p.picking}
                onPress={() => p.onGo("foods")}
              />
            )}
            {d.step === "foods" && (
              <>
                <MealFlowButton
                  label={
                    p.saving
                      ? a.savingMeal
                      : p.error === "save"
                        ? s.common.retry
                        : m.confirmFoods
                  }
                  labelStyle={{ fontSize: emptyManual ? 13 : 16 }}
                  disabled={!d.foods.length || p.saving}
                  onPress={() => { setSavePanelHidden(false); p.onConfirm(); }}
                />
                {p.saving && (
                  <Text style={styles.confirmHint}>{a.draftKept}</Text>
                )}
                {!emptyManual && (
                  <MealTextButton label={a.saveExit} onPress={p.onSaveExit} />
                )}
              </>
            )}
            {d.step === "photo" && (
              <Text style={styles.draftNote}>{m.draftSaved}</Text>
            )}
            {p.saveStatus === "error" && (
              <AppButton
                label={s.common.retry}
                secondary
                onPress={p.onRetryDraft}
              />
            )}
          </MealFlowFooter>
        )}
        {d.editingFood && (
          <MealFoodEditorDialog
            key={d.editingFood.id}
            food={d.editingFood}
            mode={d.foods.some((item) => item.id === d.editingFood?.id) ? 'edit' : 'add'}
            meal={m}
            common={s.common}
            {...p.foodInput}
            onChange={p.onChangeFood}
            onSave={p.onSaveFood}
            onCancel={() => p.onUpdate({ editingFood: null })}
            labels={a}
          />
        )}
        {replaceConfirm && (
          <Dialog compact title={a.replaceTitle} closeLabel={s.common.close} onClose={() => setReplaceConfirm(false)} footer={<>
            <AppButton
              style={{ minHeight: 50 }}
              variant="meal"
              label={m.replace}
              labelStyle={styles.replaceButtonLabel}
              onPress={() => {
                setReplaceConfirm(false);
                setReplace(true);
              }}
            />
            <AppButton
              secondary
              style={{ minHeight: 50 }}
              variant="meal"
              label={m.cancel}
              labelStyle={styles.replaceCancelLabel}
              onPress={() => setReplaceConfirm(false)}
            />
          </>}>
            <Text style={styles.replaceBody}>{a.replaceBody}</Text>
            <Text style={styles.replaceHint}>{a.replaceHint}</Text>
          </Dialog>
        )}
        <MealPrivacySheetView
          p={{
            language: p.language,
            sheet: p.sheet,
            onSheet: p.onSheet,
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
