// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 식후 검토 글자 확대 및 오류 화면 버튼 디자인 통일

import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MealFlowButton } from '../../../components/MealFlowButton';
import { MealTextButton } from '../../../components/MealTextButton';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useAfterMealReview } from '../hooks/useAfterMealReview';
import { canAddDifficulty, difficultyNeedsNote, difficultyOptions, textureQuestions } from '../rules';
import { AfterMealReviewView } from './AfterMealReviewView';

export function AfterMealReviewScreen({ mealId }: { mealId?: string }) {
  const profile = useProfile();
  const review = useAfterMealReview(profile.profile, mealId ?? '');
  const s = copyFor(profile.language);
  const back = () => { if (review.saving) return; if (!review.back()) router.back(); };
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; });
    return () => listener.remove();
  });

  if (profile.status === 'loading') return (
    <SafeAreaView style={styles.center}><ActivityIndicator color={colors.homePrimary} /><Text style={styles.message}>{s.common.loading}</Text></SafeAreaView>
  );
  if (profile.status === 'error' || !profile.profile) return (
    <SafeAreaView style={styles.center}><Text style={styles.message}>{s.common.saveFailed}</Text><MealFlowButton label={s.common.home} onPress={() => router.replace('/')} /></SafeAreaView>
  );
  if (review.loading) return (
    <SafeAreaView style={styles.center}><ActivityIndicator color={colors.homePrimary} /><Text style={styles.message}>{s.common.loading}</Text></SafeAreaView>
  );
  if (review.loadError) return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.error}>{s.afterMealReview.loadFailed}</Text>
      <MealFlowButton label={s.common.retry} onPress={review.retryLoad} />
      <MealTextButton label={s.common.home} onPress={() => router.replace('/(main)/home')} />
    </SafeAreaView>
  );
  if (review.missingMeal || !review.meal || !review.draft) return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.error}>{s.afterMealReview.missingMeal}</Text>
      <MealFlowButton label={s.common.home} onPress={() => router.replace('/(main)/home')} />
    </SafeAreaView>
  );

  const draft = review.draft;
  const difficultyForms = Object.fromEntries(review.meal.foods.map((food) => {
    const input = draft.difficultyInputs[food.id] ?? { category: null, value: '', note: '' };
    return [food.id, {
      options: input.category === 'texture' ? textureQuestions[input.subcategory ?? ''] ?? [] : input.category ? difficultyOptions[input.category] : [],
      canAdd: canAddDifficulty(input.category, input.value, input.note, input.category === 'texture' ? input.subcategory ?? '' : undefined),
      showNote: difficultyNeedsNote(input.category, input.value),
    }];
  }));

  return (
    <AfterMealReviewView
      meal={review.meal}
      draft={draft}
      childName={profile.profile.childName}
      language={profile.language}
      saveStatus={review.saveStatus}
      finalSaveState={review.finalSaveState}
      photoError={review.photoError}
      picking={review.picking}
      saving={review.saving}
      canContinueOutcomes={review.canContinueOutcomes}
      editingFood={review.editingFood}
      ingredient={review.ingredient}
      difficultyForms={difficultyForms}
      onBack={back}
      onGo={review.go}
      onPick={(source) => { void review.pick(source); }}
      onRemovePhoto={review.removePhoto}
      onFullPhoto={(side) => {
        void review.retrySave().then(
          () => router.push({ pathname: '/after-meal-photo', params: { mealId, side } }),
          () => undefined,
        );
      }}
      onImageError={review.markImageError}
      onManual={review.manual}
      onSaveExit={() => { void review.retrySave().then(() => router.replace('/(main)/home'), () => undefined); }}
      onToggleIngredient={review.toggleIngredient}
      onSelectOutcome={review.chooseOutcome}
      onEditFood={review.editFood}
      onRemoveFood={(id) => { void review.removeFood(id); }}
      onChangeFood={review.changeFood}
      onSaveFood={() => { void review.saveFood(); }}
      onCancelFoodEdit={review.cancelFoodEdit}
      onIngredientChange={review.setIngredient}
      onAddIngredient={review.addIngredient}
      onRemoveIngredient={(name) => { review.removeIngredient(name); }}
      onDifficultyInput={review.setDifficultyInput}
      onAddDifficulty={review.addDifficultyTag}
      onRemoveDifficulty={review.removeDifficultyTag}
      onSave={() => { void review.finish(); }}
      onRetrySave={() => { void review.retrySave(); }}
      onRecommend={() => router.push({ pathname: '/recommendation/[mealId]', params: { mealId: review.meal!.id } })}
      onHome={() => router.replace('/(main)/home')}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.homeBackground },
  message: { color: colors.homeText, fontSize: 16 },
  error: { color: colors.error, fontSize: 16 },
});
