// This Code is generated with AI

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { AppIcon } from '../../../components/AppIcon';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { FoodEditor } from '../../../components/FoodEditor';
import { formStyles as ui } from '../../../components/formStyles';
import { copyFor } from '../../../util/strings';
import { MealCompleteStepView } from './MealCompleteStepView';
import { MealDetailsStepView } from './MealDetailsStepView';
import { MealFoodsStepView } from './MealFoodsStepView';
import { MealGoalSheetsView } from './MealGoalSheetsView';
import { MealPhotoStepsView } from './MealPhotoStepsView';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';
import { styles } from './mealCheckinStyles';

export function MealCheckinView(p: MealCheckinViewProps) {
  const d = p.draft;
  const s = copyFor(p.language);
  const m = s.mealCheckin;
  const [replace, setReplace] = useState(false);
  const [imageError, setImageError] = useState(false);
  const review = d.step === 'foods' || d.step === 'goal';
  const photoStep = ['photo', 'preview', 'method', 'analyzing', 'analysis-error'].includes(d.step);
  const segment = ['details', 'photo'].includes(d.step)
    ? 0
    : d.step === 'preview'
      ? 1
      : ['method', 'analyzing', 'analysis-error'].includes(d.step)
        ? 2
        : d.step === 'foods'
          ? 3
          : 4;

  return (
    <SafeAreaView style={[styles.root, d.step === 'photo' && styles.photoRoot, review && styles.reviewRoot]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={s.common.back}
            disabled={p.saving}
            onPress={p.onBack}
            style={styles.back}
          >
            <AppIcon name="back" size={18} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={ui.heading}>{m.titles[d.step]}</Text>
            {d.step === 'preview' && <Text style={styles.headerNote}>{m.draftLabel}</Text>}
            {d.step === 'method' && <Text style={styles.headerNote}>{m.photoReady}</Text>}
          </View>
        </View>
        {review && <View style={styles.reviewIntro}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewIntroTitle}>{d.foods.some((food) => food.source === 'ai') ? m.aiCount(d.foods.filter((food) => food.source === 'ai').length) : m.reviewCount(d.foods.length)}</Text>
            <Text style={styles.reviewIntroText}>{m.reviewFoodHint}</Text>
          </View>
          <View style={styles.reviewBadge}><Text style={styles.reviewBadgeText}>{m.parentReviewBadge}</Text></View>
        </View>}
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: 5, now: segment + 1 }}
          style={styles.progress}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.segment, d.step === 'photo' && styles.photoSegment, i <= segment && styles.activeSegment]} />
          ))}
        </View>
        <View style={{ flex: 1 }} pointerEvents={p.saving ? 'none' : 'auto'}>
          <ScrollView contentContainerStyle={[styles.content, d.step === 'photo' && styles.photoContent]} keyboardShouldPersistTaps="handled">
            {d.step === 'details' && (
              <>
                <MealDetailsStepView p={{ draft: d, language: p.language, dateInput: p.dateInput, onUpdate: p.onUpdate }} />
                <AppButton variant="meal" label={m.toPhoto} icon={<UiAssetIcon name="meal-arrow-right" />} disabled={!d.mealType || !d.setting} onPress={() => p.onGo('photo')} />
              </>
            )}
            {photoStep && (
              <MealPhotoStepsView
                p={{
                  draft: d, language: p.language, picking: p.picking,
                  onFullPhoto: p.onFullPhoto, onGo: p.onGo, onSheet: p.onSheet,
                  onAnalyze: p.onAnalyze, onCancelAnalysis: p.onCancelAnalysis,
                }}
                replace={replace}
                imageError={imageError}
                onReplace={() => setReplace((value) => !value)}
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
              <MealFoodsStepView p={{ draft: d, language: p.language, onEdit: p.onEdit, onRemove: p.onRemove, onGo: p.onGo, onFullPhoto: p.onFullPhoto }} />
            )}
            {d.step === 'complete' && (
              <MealCompleteStepView p={{ draft: d, language: p.language, onAfterMeal: p.onAfterMeal, onHome: p.onHome }} />
            )}
            {(p.error || imageError || p.languageError) && (
              <Text accessibilityRole="alert" style={ui.error}>
                {p.error === 'save' ? m.saveFailed
                  : p.error === 'permission' ? m.permission
                    : p.error === 'image' || imageError ? m.imageError : s.common.saveFailed}
              </Text>
            )}
          </ScrollView>
        </View>
        {(['photo', 'preview', 'foods'] as string[]).includes(d.step) && (
          <View style={styles.footer}>
            {d.step === 'preview' && (
              <AppButton variant="meal" label={m.usePhoto} icon={<UiAssetIcon name="meal-check" />} disabled={!d.photo || imageError || p.picking} onPress={() => p.onGo('method')} />
            )}
            {d.step === 'foods' && (
              <>
                <AppButton variant="meal" label={m.confirmFoods} icon={<UiAssetIcon name="meal-check" />} disabled={!d.foods.length || p.saving} onPress={p.onConfirm} />
                <Text style={styles.confirmHint}>{m.confirmFoodsHint}</Text>
                <AppButton variant="meal" secondary label={s.common.saveExit} onPress={p.onSaveExit} />
              </>
            )}
            {d.step === 'photo' && <Text style={styles.draftNote}>{m.draftSaved}</Text>}
            {p.saveStatus === 'error' && <AppButton label={s.common.retry} secondary onPress={p.onRetryDraft} />}
          </View>
        )}
        {d.editingFood && (
          <FoodEditor
            key={d.editingFood.id}
            food={d.editingFood}
            labels={{ meal: m, common: s.common }}
            traits={p.traits}
            {...p.foodInput}
            onChange={p.onChangeFood}
            onSave={p.onSaveFood}
            onCancel={() => p.onUpdate({ editingFood: null })}
            onEditTraits={() => p.onTraits(d.editingFood!.traits)}
            onToggleTrait={p.onToggleTrait}
            onSaveTraits={p.onSaveTraits}
            onCancelTraits={() => p.onTraits(null)}
            goal={{
              label: m.goalLabel,
              value: d.exposureFoodId === d.editingFood.id ? d.editingFood.name || m.goalNotSet : m.goalNotSet,
              actionLabel: s.common.add,
              onPress: () => p.onUpdate({ exposureFoodId: d.editingFood!.id }),
            }}
          />
        )}
        <MealGoalSheetsView p={{
          draft: d, language: p.language, sheet: p.sheet, saving: p.saving, error: p.error,
          onSheet: p.onSheet, onGo: p.onGo, onUpdate: p.onUpdate, onSave: p.onSave,
        }} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
