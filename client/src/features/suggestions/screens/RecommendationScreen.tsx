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
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 추천 카드의 저장·제외 버튼 이름, 재생성과 Use now 체크인 연결

import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { AppHeader } from '../../../components/AppHeader';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../providers/ProfileProvider';
import type { DismissReason } from '../../../types/suggestionRecord';
import { suggestionCopyFor } from '../../../util/strings';
import { RecommendationCard } from '../components/RecommendationCard';
import { RecommendationStateCard } from '../components/RecommendationStateCard';
import { useRecommendationFlow } from '../hooks/useRecommendationFlow';
import { suggestionStyles as s } from './suggestionStyles';

function RecommendationContent({ userId }: { userId: string }) {
  const { language } = useProfile();
  const c = suggestionCopyFor(language);
  const model = useRecommendationFlow(userId);
  const current = model.current;
  const [reasons, setReasons] = useState<DismissReason[] | null>(null);
  const saveAndOpenCheckin = () => model.changeDecision('saved', [], savedSuggestion => {
    router.push({ pathname: '/meal-checkin', params: { tryingSuggestionId: savedSuggestion.id } });
  });
  const back = () => {
    if (model.busy) return;
    if (current?.status === 'pending' && reasons) setReasons(null);
    else router.dismissTo('/home');
  };
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => listener.remove();
  });
  const saved = current?.status === 'saved';
  if (current && current.status !== 'pending') return <SafeAreaView style={s.root} edges={['top', 'bottom']}>
    <AppHeader title={c.title} backLabel={c.backHome} onBack={back} disabled={model.busy} />
    <ScrollView contentContainerStyle={s.completed}>
      <View style={[s.completionCard, saved ? s.savedBackground : s.dismissedBackground]}>
        <Image source={saved ? require('../../../../assets/ui/suggestion-saved-badge.svg')
          : require('../../../../assets/ui/suggestion-dismissed-badge.svg')}
          style={saved ? s.savedBadge : s.dismissedBadge} contentFit="contain" />
        <Text style={s.completionTitle}>{saved ? c.savedNotice : c.dismissedNotice}</Text>
        {saved && <Text style={s.completionDetail}>{c.savedLocation}</Text>}
        {!saved && current.dismissReasons.length > 0 && <View style={s.completionReasons}>
          <Text style={s.reasonHeading}>{c.because}</Text>
          {current.dismissReasons.map(reason =>
            <Text key={reason} style={[s.text, s.centeredText]}>{c.reasons[reason]}</Text>)}
        </View>}
        <View style={s.completionActions}>
          {model.decisionFailed && <Text accessibilityRole="alert" style={s.error}>{c.saveFailed}</Text>}
          {model.regenerationFailed && <Text accessibilityRole="alert" style={s.error}>{c.generationTitle}</Text>}
          <Text style={[s.muted, s.centeredText]}>{model.regenerationLimited ? c.dailyLimit : c.regenerateHint}</Text>
          <AppButton variant="suggestion" disabled={model.busy || model.regenerationLimited}
            label={model.regenerating ? c.generating : model.regenerationFailed ? c.retry : c.regenerate}
            onPress={() => { setReasons(null); model.regenerate(); }} />
          <AppButton variant="suggestion" secondary style={s.leaveButton} labelStyle={s.leaveLabel}
            disabled={model.busy} label={c.leave} onPress={back} />
        </View>
      </View>
    </ScrollView>
    <Pressable accessibilityRole="button" accessibilityLabel={c.undoLast}
      disabled={model.busy} style={s.completionUndo} onPress={() => {
        setReasons(null);
        model.changeDecision('pending');
      }}>
      <Text style={s.undoLabel}>{c.undoLast}</Text>
    </Pressable>
  </SafeAreaView>;

  return <SafeAreaView style={s.root} edges={['top', 'bottom']}>
    <AppHeader title={c.title} backLabel={reasons ? c.back : c.backHome} onBack={back} disabled={model.busy} />
    <ScrollView contentContainerStyle={s.recommendationContent}>
      {!current && <RecommendationStateCard language={language}
        failed={model.generationFailed} onRetry={model.request} />}
      {current && reasons && <View style={s.cardStack}>
        <View style={[s.stackFace, s.dismissCard]}>
          <Text style={s.muted}>{current.foodName}</Text>
          <Text style={s.heading}>{c.dismissTitle}</Text>
          {model.decisionFailed && <Text accessibilityRole="alert" style={s.error}>{c.saveFailed}</Text>}
          <ScrollView contentContainerStyle={s.reasonList}>
            {(Object.keys(c.reasons) as DismissReason[]).map((reason) => <Pressable
              key={reason} accessibilityRole="checkbox"
              accessibilityState={{ checked: reasons.includes(reason) }} disabled={model.busy}
              style={s.reasonChoice}
              onPress={() => setReasons(reasons.includes(reason)
                ? reasons.filter((item) => item !== reason) : [...reasons, reason])}>
              <View style={[s.checkbox, reasons.includes(reason) && s.checkboxChecked]}>
                {reasons.includes(reason) && <UiAssetIcon name="suggestion-checked" />}
              </View>
              <Text style={[s.text, s.grow]}>{c.reasons[reason]}</Text>
            </Pressable>)}
          </ScrollView>
          <View style={s.reasonActions}>
            <AppButton variant="suggestion" style={s.reasonButton} secondary label={c.skipReason}
              disabled={model.busy} onPress={() => model.changeDecision('dismissed', [])} />
            <AppButton variant="suggestion" style={s.reasonButton}
              disabled={model.busy || !reasons.length} label={c.done}
              onPress={() => model.changeDecision('dismissed', reasons)} />
          </View>
        </View>
      </View>}
      {current && !reasons && <RecommendationCard item={current} language={language} disabled={model.busy}
        onSave={() => model.changeDecision('saved')} onDismiss={() => setReasons([])} />}
    </ScrollView>
    {current && !reasons && <View style={s.recommendationFooter}>
      {model.decisionFailed && <Text accessibilityRole="alert" style={s.error}>{c.saveFailed}</Text>}
      <View style={s.recommendationActions}>
        <Pressable accessibilityRole="button" accessibilityLabel={c.dismiss} disabled={model.busy}
          style={[s.labeledAction, model.busy && s.disabled]} onPress={() => setReasons([])}>
          <View style={[s.actionCircle, s.dismissAction]}><UiAssetIcon name="suggestion-dismiss" /></View>
          <Text style={s.actionCaption}>{c.dismissCaption}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={c.useNow} disabled={model.busy}
          style={[s.useNowAction, model.busy && s.disabled]} onPress={saveAndOpenCheckin}>
          <Text style={s.useNowLabel}>{c.useNow}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={c.save} disabled={model.busy}
          style={[s.labeledAction, model.busy && s.disabled]} onPress={() => model.changeDecision('saved')}>
          <View style={[s.actionCircle, s.saveAction]}><UiAssetIcon name="suggestion-save" /></View>
          <Text style={[s.actionCaption, s.saveCaption]}>{c.saveCaption}</Text>
        </Pressable>
      </View>
    </View>}
  </SafeAreaView>;
}

export function RecommendationScreen() {
  const profile = useProfile();
  const auth = useAuth();
  if (profile.status === 'loading' || auth.status === 'loading') return <View style={s.root} />;
  if (!profile.profile || !auth.session) return <Redirect href="/" />;
  return <RecommendationContent key={auth.session.user.id} userId={auth.session.user.id} />;
}
