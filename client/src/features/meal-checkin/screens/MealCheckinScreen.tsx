// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { MealDraftResumeView } from './MealDraftResumeView';
import { MealCheckinView } from './MealCheckinView';
import { useProfile } from '../../../providers/ProfileProvider';
import { useMealSuggestions } from '../hooks/useMealSuggestions';
import { useMealCheckin } from '../hooks/useMealCheckin';
import { useMealCheckinInputs } from '../hooks/useMealCheckinInputs';

export function MealCheckinScreen({
  childId,
  language,
  onLanguage,
  afterMealIntent,
  startAfterMealId,
  tryingSuggestionId,
}: {
  childId: string;
  language: Language;
  onLanguage: () => Promise<void>;
  afterMealIntent: boolean;
  startAfterMealId?: string;
  tryingSuggestionId?: string;
}) {
  const profile = useProfile().profile;
  const saved = useMealSuggestions(childId);
  const model = useMealCheckin(childId, startAfterMealId, !!tryingSuggestionId, saved.suggestions, tryingSuggestionId);
  const [trying, setTrying] = useState(true);
  const [languageError, setLanguageError] = useState(false);
  const inputs = useMealCheckinInputs({
    draft: model.draft,
    onUpdate: model.update,
    onEditFood: model.edit,
    onChangeFood: model.changeFood,
  });
  const s = copyFor(language);
  const exit = async () => {
    if (model.saving) return;
    if (model.draft?.step === 'complete' || (await model.flush()))
      router.replace('/(main)/home');
  };
  const back = () => {
    if (model.saving) return;
    if (model.resumeRequired || !model.back()) void exit();
  };
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        back();
        return true;
      },
    );
    return () => subscription.remove();
  });
  const afterMeal = (mealId: string) =>
    router.replace({ pathname: '/after-meal-review', params: { mealId } });
  const saveCheckin = () => {
    void model.save(trying ? tryingSuggestionId : undefined).then((id) => {
      if (!id) return;
      if (afterMealIntent) afterMeal(id);
    });
  };
  if (!model.draft)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 24,
          gap: 12,
          backgroundColor: colors.homeBackground,
        }}
      >
        {model.loadError ? (
          <>
            <Text style={{ color: colors.error }}>
              {s.mealCheckin.loadFailed}
            </Text>
            <AppButton
              label={s.common.retry}
              onPress={() => {
                void model.reload();
              }}
            />
            <AppButton
              secondary
              label={s.common.home}
              onPress={() => router.replace('/(main)/home')}
            />
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.homePrimary} />
            <Text style={{ color: colors.homeText }}>{s.common.loading}</Text>
          </>
        )}
      </SafeAreaView>
    );
  if (model.resumeRequired) return <MealDraftResumeView draft={model.draft} childName={profile?.childName ?? ''} language={language} onContinue={model.continueDraft} onBack={() => { void exit(); }} />;
  return (
    <MealCheckinView
      draft={model.draft}
      childName={profile?.childName ?? ''}
      onConfirmFood={model.confirmFood}
      removedName={model.removed?.food.name}
      onUndoRemove={model.undoRemove}
      suggestions={saved.suggestions}
      ingredientOptions={saved.ingredientOptions}
      suggestionLinking={model.suggestionLinking}
      suggestionsLoading={saved.loading}
      suggestionsError={saved.error}
      onRetrySuggestions={saved.retry}
      tryingSuggestion={tryingSuggestionId ? { checked: trying, onToggle: () => setTrying(value => !value) } : undefined}
      language={language}
      saveStatus={model.saveStatus}
      error={model.error}
      picking={model.picking}
      saving={model.saving}
      sheet={model.sheet}
      languageError={languageError}
      dateInput={inputs.date}
      foodInput={inputs.food}
      onUpdate={model.update}
      onGo={model.go}
      onBack={back}
      onSaveExit={() => { void exit(); }}
      onPick={(source) => {
        void model.pick(source);
      }}
      onFullPhoto={() => {
        void model.flush().then((saved) => {
          if (saved)
            router.push({
              pathname: '/meal-photo',
              params: { photoId: model.draft?.photo?.id },
            });
        });
      }}
      onEdit={inputs.editFood}
      onRemove={model.removeFood}
      onRemovePhoto={model.removePhoto}
      onChangeFood={model.changeFood}
      onSaveFood={model.saveFood}
      onConfirm={() => { model.confirm(); saveCheckin(); }}
      onAfterMeal={() => {
        if (model.draft?.savedMealId) afterMeal(model.draft.savedMealId);
      }}
      onHome={() => {
        void exit();
      }}
      onSheet={model.setSheet}
      onRetryDraft={() => {
        void model.flush();
      }}
      onLanguage={() => {
        void onLanguage().then(
          () => setLanguageError(false),
          () => setLanguageError(true),
        );
      }}
    />
  );
}
