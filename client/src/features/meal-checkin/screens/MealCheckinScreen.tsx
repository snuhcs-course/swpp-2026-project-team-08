// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 네이티브 날짜 선택 및 재료 입력 연동
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: MyPage 언어 전환 연결 및 미사용 언어 코드 정리
// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 초안 뒤로가기 시 저장 후 진입 화면으로 복귀

import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  afterMealIntent,
  startAfterMealId,
  tryingSuggestionId,
}: {
  childId: string;
  language: Language;
  afterMealIntent: boolean;
  startAfterMealId?: string;
  tryingSuggestionId?: string;
}) {
  const profile = useProfile().profile;
  const saved = useMealSuggestions(childId);
  const model = useMealCheckin(childId, startAfterMealId, !!tryingSuggestionId, saved.suggestions, tryingSuggestionId);
  const [trying, setTrying] = useState(true);
  const exiting = useRef(false);
  const inputs = useMealCheckinInputs({
    draft: model.draft,
    onUpdate: model.update,
    onEditFood: model.edit,
    onChangeFood: model.changeFood,
  });
  const s = copyFor(language);
  const exit = async (destination: 'home' | 'previous' = 'home') => {
    if (model.saving || exiting.current) return;
    exiting.current = true;
    try {
      if (model.draft?.step !== 'complete' && !(await model.flush())) return;
      if (destination === 'previous' && router.canGoBack()) router.back();
      else router.replace('/(main)/home');
    } finally {
      exiting.current = false;
    }
  };
  const back = () => {
    if (model.saving || exiting.current) return;
    if (model.resumeRequired || !model.back()) void exit('previous');
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
  if (model.resumeRequired) return <MealDraftResumeView draft={model.draft} childName={profile?.childName ?? ''} language={language} onContinue={model.continueDraft} onBack={back} />;
  return (
    <MealCheckinView
      draft={model.draft}
      childName={profile?.childName ?? ''}
      onConfirmFood={model.confirmFood}
      removedName={model.removed?.food.name}
      onUndoRemove={model.undoRemove}
      suggestions={saved.suggestions}
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
    />
  );
}
