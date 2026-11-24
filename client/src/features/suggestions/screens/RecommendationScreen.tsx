// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천 대상과 새 거절 사유 키 적용
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: Eaten 대상의 어려움·추천 제외 및 빈 단계 건너뛰기

// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Keep target chooser available with existing selections and cards

// AI-generated with GPT-6, 2026-11-13, reviewed by Haechan Jung
// Changed: 추가 추천 선택 화면 연결 및 Skip 버튼 제거

import { AppHeader } from '../../../components/AppHeader';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { useProfile } from '../../../providers/ProfileProvider';
import { useAuth } from '../../../providers/AuthProvider';
import type { DismissReason, SuggestionTarget } from '../../../types/suggestionRecord';
import { suggestionCopyFor, copyFor } from '../../../util/strings';
import { RegenerationPrompt } from '../components/RegenerationPrompt';
import { RecommendationStateCard } from '../components/RecommendationStateCard';
import { suggestionTargetName } from '../components/GeneratedSuggestionBody';
import { RecommendationCard } from '../components/RecommendationCard';
import { ChangeFoodsSheet } from '../components/ChangeFoodsSheet';
import { useRecommendationFlow } from '../hooks/useRecommendationFlow';
import { suggestionStyles as s } from './suggestionStyles';

const targetKey = (target: SuggestionTarget) => target.foodId;

function RecommendationContent({ userId, mealId }: { userId: string; mealId: string }) {
  const { language } = useProfile();
  const c = suggestionCopyFor(language);
  const model = useRecommendationFlow(userId, mealId);
  const [sheet, setSheet] = useState(false);
  const [reject, setReject] = useState(false);
  const [reasons, setReasons] = useState<DismissReason[]>([]);
  const meal = model.source.data;
  const current = model.current;
  const backMeal = () => router.replace({ pathname: '/meal/[mealId]', params: { mealId } });
  const back = () => {
    if (model.busy && !model.regeneratingId) return;
    if (model.regeneratingId) { backMeal(); return; }
    if (sheet) { setSheet(false); return; }
    if (reject) { setReject(false); setReasons([]); return; }
    if (model.items.length && !current && model.canUndo) { void model.undo(); return; }
    backMeal();
  };
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => listener.remove();
  });
  if (model.sourceUnavailable) return <Redirect href="/home" />;
  if (model.source.isSuccess && !model.source.isFetching && model.source.isFetchedAfterMount
      && meal?.review && !model.targetOptions.length) {
    return <Redirect href={{ pathname: '/meal/[mealId]', params: { mealId } }} />;
  }
  const targetSheet = sheet && meal && <ChangeFoodsSheet
    current={model.visibleTargets}
    options={model.targetOptions}
    language={language}
    onClose={() => setSheet(false)}
    onUpdate={(targets) => {
      setSheet(false);
      setReject(false);
      setReasons([]);
      void model.selectTargets(targets);
    }}
  />;
  const loadFailed = (model.source.isError && !meal)
    || (model.suggestions.isError && !model.suggestions.data);
  const completed = model.items.length > 0 && !current && !model.regenerationPrompt && !model.generating
    && !model.generationFailed && !model.source.isPending && !model.suggestions.isPending
    && !loadFailed;
  if (completed) return <SafeAreaView style={s.root} edges={['top', 'bottom']}>
    <ScrollView contentContainerStyle={s.completed}>
      <View style={s.completionBadge}><UiAssetIcon name="suggestion-complete" /></View>
      <Text style={s.completionTitle}>{c.allDone}</Text>
      <Text style={s.completionBody}>{c.allDoneBody}</Text>
      <View style={s.completionActions}>
        <AppButton variant="suggestion" label={c.savedTitle} onPress={() => router.replace({ pathname: '/section/[name]', params: { name: 'ideas' } })} />
        <AppButton variant="suggestion" secondary label={c.backMeal} onPress={backMeal} />
      </View>
      {model.failed && <Text accessibilityRole="alert" style={s.error}>{c.saveFailed}</Text>}
    </ScrollView>
    {model.canUndo && <Pressable accessibilityRole="button" accessibilityLabel={c.undoLast}
      disabled={model.busy} style={s.completionUndo} onPress={() => { void model.undo(); }}>
      <Text style={s.undoLabel}>{c.undoLast}</Text>
    </Pressable>}
  </SafeAreaView>;

  return <SafeAreaView style={s.root} edges={['top', 'bottom']}>
    <AppHeader title={c.title} backLabel={c.back} onBack={back} />
    <ScrollView contentContainerStyle={s.recommendationContent}>
      {meal && <View style={s.row}>
        <Text style={s.mealContextDate}>
          {new Date(`${meal.mealDate}T12:00:00`).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <Text style={s.link}>{copyFor(language).mealCheckin.types[meal.mealType]}</Text>
      </View>}
      {meal && <View style={s.targetSection}>
        <View style={s.savedCardHeading}>
          <Text style={s.savedFoodName}>{c.targets}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={c.changeFoods}
            disabled={model.busy || !model.targetOptions.length}
            style={s.changeFoodsAction} onPress={() => setSheet(true)}>
            <Text style={s.changeFoodsLabel}>{c.changeFoods}</Text>
            <UiAssetIcon name="suggestion-edit" />
          </Pressable>
        </View>
        <View style={s.wrap}>
          {model.visibleTargets.map((target, index) => <View key={`${targetKey(target)}:${index}`} style={s.chip}>
            <Text style={s.ingredientLabel}>
              {model.targetOptions.find((option) => targetKey(option.target) === targetKey(target))?.name
                ?? meal.foods.find((food) => food.id === target.foodId)?.name}
            </Text>
          </View>)}
        </View>
      </View>}
      {model.source.isPending || model.suggestions.isPending || model.generating ? (
        <RecommendationStateCard language={language} onRetry={() => { void model.refresh(); }} />
      ) : loadFailed || model.generationFailed ? (
        <RecommendationStateCard language={language} failed onRetry={() => {
          if (model.generationFailed && model.visibleTargets.length) void model.selectTargets(model.visibleTargets);
          else void model.refresh();
        }} />
      ) : model.regenerationPrompt ? <RegenerationPrompt
        foodName={suggestionTargetName(model.regenerationPrompt, meal)}
        reasons={model.regenerationPrompt.dismissReasons} language={language}
        busy={model.busy} generating={model.regeneratingId !== null}
        failed={model.regenerationErrorId === model.regenerationPrompt.id}
        onGenerate={() => { void model.regenerate(model.regenerationPrompt!.id); }}
        onContinue={model.continueAfterDismissal}
      /> : current ? (
        reject ? <View style={s.cardStack}>
          <View style={[s.stackLayer, s.stackBack]} />
          <View style={[s.stackLayer, s.stackMiddle]} />
          <View style={[s.stackFace, s.dismissCard]}>
            <Text style={s.muted}>
              {suggestionTargetName(current, meal)}
            </Text>
            <Text style={s.heading}>{c.dismissTitle}</Text>
            {model.failed && <Text accessibilityRole="alert" style={s.error}>{c.saveFailed}</Text>}
            <ScrollView contentContainerStyle={s.reasonList}>
              {(Object.keys(c.reasons) as DismissReason[]).map((reason) => <Pressable
                key={reason} accessibilityRole="checkbox"
                accessibilityState={{ checked: reasons.includes(reason) }} disabled={model.busy}
                style={s.reasonChoice}
                onPress={() => setReasons((old) => old.includes(reason)
                  ? old.filter((item) => item !== reason) : [...old, reason])}>
                <View style={[s.checkbox, reasons.includes(reason) && s.checkboxChecked]}>
                  {reasons.includes(reason) && <UiAssetIcon name="suggestion-checked" />}
                </View>
                <Text style={[s.text, s.grow]}>{c.reasons[reason]}</Text>
              </Pressable>)}
            </ScrollView>
            <View style={s.reasonActions}>
              <AppButton variant="suggestion" style={s.reasonButton} secondary label={c.cancel}
                onPress={() => { setReject(false); setReasons([]); }} />
              <AppButton variant="suggestion" style={s.reasonButton}
                disabled={model.busy || !reasons.length} label={c.done}
                onPress={() => { void model.decide('dismissed', reasons).then((ok) => {
                  if (ok) { setReject(false); setReasons([]); }
                }); }} />
            </View>
          </View>
        </View> : <RecommendationCard
          key={current.id} item={current} language={language}
          foodName={suggestionTargetName(current, meal)}
          index={model.items.findIndex((item) => item.id === current.id) + 1}
          total={model.items.length} disabled={model.busy}
          onSave={() => { void model.decide('saved'); }}
          onDismiss={() => { setReject(true); setReasons([]); }}
        />
      ) : <View style={s.emptyState}>
        <Text style={s.savedIntro}>{meal?.review ? c.selectTargetsPrompt : c.reviewRequired}</Text>
        {model.targetOptions.length > 0 && <AppButton variant="suggestion" label={c.changeFoods}
          onPress={() => setSheet(true)} />}
      </View>}
    </ScrollView>
    {((current && !reject) || model.regenerationPrompt) && <View style={s.recommendationFooter}>
      <View style={s.actionStatus}>
        <Text accessibilityRole={model.failed ? 'alert' : undefined}
          accessibilityLiveRegion="polite" style={[s.statusMessage, model.failed && s.error]}>
          {model.failed ? c.saveFailed : model.notice === 'saved' ? c.savedNotice
            : model.notice === 'dismissed' ? c.dismissedNotice : ''}
        </Text>
        {model.canUndo && <Pressable accessibilityRole="button" accessibilityLabel={c.undo}
          disabled={model.busy} style={[s.undoAction, model.busy && s.disabled]}
          onPress={() => { void model.undo(); }}><Text style={s.undoLabel}>{c.undo}</Text></Pressable>}
      </View>
      {current && <View style={s.recommendationActions}>
        <Pressable accessibilityRole="button" accessibilityLabel={c.dismiss} disabled={model.busy}
          style={[s.dismissAction, model.busy && s.disabled]}
          onPress={() => { setReject(true); setReasons([]); }}><UiAssetIcon name="suggestion-dismiss" /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={c.save} disabled={model.busy}
          style={[s.saveAction, model.busy && s.disabled]}
          onPress={() => { void model.decide('saved'); }}><UiAssetIcon name="suggestion-save" /></Pressable>
      </View>}
    </View>}
    {targetSheet}
  </SafeAreaView>;
}
export function RecommendationScreen({ mealId }: { mealId: string }) {
  const profile = useProfile();
  const auth = useAuth();
  if (profile.status === 'loading' || auth.status === 'loading') return <View style={s.root} />;
  if (!profile.profile || !auth.session) return <Redirect href="/" />;
  return <RecommendationContent key={`${auth.session.user.id}:${mealId}`}
    userId={auth.session.user.id} mealId={mealId} />;
}
