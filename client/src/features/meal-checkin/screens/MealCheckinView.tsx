import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { AppIcon } from '../../../components/AppIcon';
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
  const segment = d.step === 'details'
    ? 0
    : ['photo', 'preview'].includes(d.step)
      ? 1
      : ['method', 'analyzing', 'analysis-error'].includes(d.step)
        ? 2
        : d.step === 'foods'
          ? 3
          : 4;

  return (
    <SafeAreaView style={[styles.root, review && styles.reviewRoot]} edges={['top', 'bottom']}>
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
          <Text style={[ui.heading, { flex: 1 }]}>{m.titles[d.step]}</Text>
          <Pressable accessibilityRole="button" onPress={p.onLanguage}>
            <Text style={ui.link}>{s.common.language}</Text>
          </Pressable>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: 5, now: segment + 1 }}
          style={styles.progress}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.segment, i <= segment && styles.activeSegment]} />
          ))}
        </View>
        <View style={{ flex: 1 }} pointerEvents={p.saving ? 'none' : 'auto'}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {d.step === 'details' && (
              <MealDetailsStepView p={{
                draft: d, language: p.language, dateInput: p.dateInput, onUpdate: p.onUpdate,
              }} />
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
              <MealFoodsStepView p={{ draft: d, language: p.language, onEdit: p.onEdit, onRemove: p.onRemove }} />
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
        {d.step !== 'complete' && (
          <View style={styles.footer}>
            {d.step === 'details' && (
              <AppButton variant="meal" label={m.toPhoto} disabled={!d.mealType || !d.setting} onPress={() => p.onGo('photo')} />
            )}
            {d.step === 'preview' && (
              <AppButton variant="meal" label={m.usePhoto} disabled={!d.photo || imageError || p.picking} onPress={() => p.onGo('method')} />
            )}
            {d.step === 'foods' && (
              <AppButton variant="meal" label={m.confirmFoods} disabled={!d.foods.length || p.saving} onPress={p.onConfirm} />
            )}
            <Text accessibilityLiveRegion="polite" style={ui.muted}>
              {p.saveStatus === 'saving' ? s.common.saving : p.saveStatus === 'error' ? s.common.saveFailed : s.common.saved}
            </Text>
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
