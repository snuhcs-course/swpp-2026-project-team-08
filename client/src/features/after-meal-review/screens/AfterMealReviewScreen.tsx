import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { savedSuggestionText } from '../../../rules/recommendationPresentation';
import { useAfterMealReview } from '../hooks/useAfterMealReview';
import { canAddDifficulty, difficultyNeedsNote, difficultyOptions } from '../rules';
import { AfterMealReviewView } from './AfterMealReviewView';

export function AfterMealReviewScreen({ mealId }: { mealId?: string }) {
  const profile = useProfile();
  const review = useAfterMealReview(profile.profile, mealId ?? '');
  const s = copyFor(profile.language);
  const back = () => { if (!review.back()) router.back(); };
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; });
    return () => listener.remove();
  });

  if (profile.status === 'loading') return (
    <SafeAreaView style={styles.center}><ActivityIndicator color={colors.homePrimary} /><Text style={styles.message}>{s.common.loading}</Text></SafeAreaView>
  );
  if (profile.status === 'error' || !profile.profile) return (
    <SafeAreaView style={styles.center}><Text style={styles.message}>{s.common.saveFailed}</Text><AppButton label={s.common.home} onPress={() => router.replace('/')} /></SafeAreaView>
  );
  if (review.loading) return (
    <SafeAreaView style={styles.center}><ActivityIndicator color={colors.homePrimary} /><Text style={styles.message}>{s.common.loading}</Text></SafeAreaView>
  );
  if (review.loadError) return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.error}>{s.afterMealReview.loadFailed}</Text>
      <AppButton label={s.common.retry} onPress={review.retryLoad} />
      <AppButton secondary label={s.common.home} onPress={() => router.replace('/(main)/home')} />
    </SafeAreaView>
  );
  if (review.missingMeal || !review.meal || !review.draft) return (
    <SafeAreaView style={styles.center}>
      <Text style={styles.error}>{s.afterMealReview.missingMeal}</Text>
      <AppButton label={s.common.home} onPress={() => router.replace('/(main)/home')} />
    </SafeAreaView>
  );

  const draft = review.draft;
  const difficultyForms = Object.fromEntries(review.meal.foods.map((food) => {
    const input = draft.difficultyInputs[food.id] ?? { category: null, value: '', note: '' };
    return [food.id, {
      options: input.category ? difficultyOptions[input.category] : [],
      canAdd: canAddDifficulty(input.category, input.value, input.note),
      showNote: difficultyNeedsNote(input.category, input.value),
    }];
  }));

  return (
    <AfterMealReviewView
      meal={review.meal}
      draft={draft}
      childName={profile.profile.childName}
      suggestionCards={Object.fromEntries(review.savedSuggestions.map((item) => [
        item.id, savedSuggestionText(item, profile.language, profile.profile!),
      ]))}
      language={profile.language}
      savedSuggestions={review.savedSuggestions}
      suggestionsLoading={review.suggestionsLoading}
      saveStatus={review.saveStatus}
      photoError={review.photoError}
      picking={review.picking}
      elapsedSeconds={review.elapsedSeconds}
      saving={review.saving}
      canContinueOutcomes={review.canContinueOutcomes}
      editingFood={review.editingFood}
      editingTraits={review.editingTraits}
      ingredient={review.ingredient}
      customTrait={review.customTrait}
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
      onCompare={() => { void review.compare(); }}
      onCancelComparison={review.cancelComparison}
      onManual={review.manual}
      onSelectOutcome={review.chooseOutcome}
      onEditFood={review.editFood}
      onRemoveFood={(id) => { void review.removeFood(id); }}
      onChangeFood={review.changeFood}
      onSaveFood={() => { void review.saveFood(); }}
      onCancelFoodEdit={review.cancelFoodEdit}
      onSetTraits={review.setEditingTraits}
      onToggleTrait={review.toggleTrait}
      onSaveTraits={review.saveTraits}
      onIngredientChange={review.setIngredient}
      onAddIngredient={review.addIngredient}
      onRemoveIngredient={(name) => { review.removeIngredient(name); }}
      onCustomTraitChange={review.setCustomTrait}
      onAddCustomTrait={review.addCustomTrait}
      onDifficultyInput={review.setDifficultyInput}
      onAddDifficulty={review.addDifficultyTag}
      onRemoveDifficulty={review.removeDifficultyTag}
      onGoalFeedback={review.setGoalFeedback}
      onSuggestionFeedback={review.markSuggestion}
      onSave={() => { void review.finish(); }}
      onRetrySave={() => {
        if (draft.step === 'suggestions') void review.finish();
        else void review.retrySave();
      }}
      onNextSuggestion={(id) => router.push({ pathname: '/suggestion/[id]', params: { id } })}
      onRecommend={() => router.push({ pathname: '/recommendation/[mealId]', params: { mealId: review.meal!.id } })}
      onHome={() => router.replace('/(main)/home')}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.homeBackground },
  message: { color: colors.homeText, fontSize: 12 },
  error: { color: colors.error, fontSize: 12 },
});
