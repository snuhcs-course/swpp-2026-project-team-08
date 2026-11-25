// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 온보딩 주관식 입력 시 키보드 위로 스크롤
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 거부 음식 온보딩
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 감각 프로필 표시 및 식생활 유형 질문 제거
// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Dietary Pattern 선택 및 저장; 동작별 버튼 문구 구분; 공통 진행 바 사용
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Dietary Pattern 선택 및 저장; 동작별 버튼 문구 구분
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 채식 단계의 필수 표시 제거
// AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
// Changed: 온보딩 완료 제출 중 버튼 회전 표시

import { ProgressBar } from '../../../components/ProgressBar';
import { AppHeader, topBarStyles } from '../../../components/AppHeader';
import { createContext, useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { AppButton } from '../../../components/AppButton';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import type { OnboardingStep } from '../types';
import { styles } from './onboardingFlowStyles';

export const OnboardingInputFocusContext = createContext<(input: ComponentRef<typeof TextInput> | null) => void>(() => {});

export function OnboardingFlowView({
  language, step, stepIndex, stepCount, childName, saveStatus, submitting, canContinue,
  content, continueLabel, previousLabel, onPrevious, onContinue, onRetrySave,
}: {
  language: Language;
  step: OnboardingStep;
  stepIndex: number;
  stepCount: number;
  childName: string;
  saveStatus: 'saving' | 'saved' | 'error';
  submitting: boolean;
  canContinue: boolean;
  content: ReactNode;
  continueLabel?: string;
  previousLabel?: string;
  onPrevious: () => void;
  onContinue: () => void;
  onSaveExit: () => void;
  onRetrySave: () => void;
}) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const focusedInput = useRef<ComponentRef<typeof TextInput> | null>(null);
  const scrollOffset = useRef(0);
  const revealInput = () => {
    scrollRef.current?.measureInWindow((_x, y, _width, height) => {
      focusedInput.current?.measureInWindow((_inputX, inputY, _inputWidth, inputHeight) => {
        const overlap = inputY + inputHeight - (y + height);
        if (overlap > 0) scrollRef.current?.scrollTo({ y: scrollOffset.current + overlap + 12, animated: true });
      });
    });
  };
  useEffect(() => {
    if (step !== 'sensory' && step !== 'refused-foods') return;
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (step === 'sensory') scrollRef.current?.scrollToEnd({ animated: true });
      else revealInput();
    });
    return () => subscription.remove();
  }, [step]);
  const s = copyFor(language);
  const title = step === 'refused-foods' ? s.refusedFoods.title(childName || s.onboarding.childFallback) : step === 'sensory' ? s.sensory.title : step === 'safe-foods'
    ? s.onboarding.safeFoodsTitle(childName || s.onboarding.childFallback)
    : step === 'review'
      ? s.onboarding.reviewTitle(childName || s.onboarding.childFallback)
      : s.onboarding.titles[step];
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AppHeader title={title} />
        <View style={[topBarStyles.details, step === 'sensory' && { paddingBottom: 6 }]}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{s.onboarding.progress(stepIndex + 1, stepCount)}</Text>
            <View style={styles.headerRight}>
              {saveStatus === 'error'
                ? <Feather name="cloud-off" size={13} color={colors.error} />
                : <UiAssetIcon name="onboarding-cloud-check" />}
              <Text style={[styles.saveText, saveStatus === 'error' && styles.saveError]}>
                {saveStatus === 'saving' ? s.common.saving : saveStatus === 'error' ? s.common.saveFailed : s.common.saved}
              </Text>
            </View>
          </View>
          <ProgressBar variant="continuous" current={stepIndex + 1} total={stepCount}
            style={styles.track} fillStyle={styles.fill} accessible={false} />
          {step !== 'sensory' && step !== 'family' && <Text style={styles.subtitle}>{step === 'refused-foods' ? s.refusedFoods.description(childName || s.onboarding.childFallback) : step === 'safe-foods' ? s.onboarding.safeFoodsDescription(childName || s.onboarding.childFallback) : s.onboarding.subtitles[step]}</Text>}
        </View>
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}
          onScroll={event => { scrollOffset.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16}>
          <OnboardingInputFocusContext.Provider value={input => {
            focusedInput.current = input;
            if (input && Keyboard.isVisible()) requestAnimationFrame(revealInput);
          }}>{content}</OnboardingInputFocusContext.Provider>
          {saveStatus === 'error' && <AppButton label={s.common.retry} compact secondary onPress={onRetrySave} style={styles.retry} />}
        </ScrollView>
        <View style={styles.footer}>
          {step !== 'account' && (step !== 'consent' || canContinue) && <AppButton label={previousLabel ?? s.common.previous} secondary onPress={onPrevious} style={styles.previous} />}
          <AppButton
            label={continueLabel ?? (step === 'review' ? s.onboarding.looksGood : s.common.continue)}
            disabled={submitting || !canContinue}
            icon={step === 'review' && submitting
              ? <ActivityIndicator size="small" color={colors.surface}
                  accessibilityRole="progressbar" accessibilityLabel={s.common.saving} />
              : undefined}
            onPress={onContinue}
            style={styles.next}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
