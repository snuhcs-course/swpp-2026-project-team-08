// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Dietary Pattern 선택 및 저장; 동작별 버튼 문구 구분; 공통 진행 바 사용
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화

import { ProgressBar } from '../../../components/ProgressBar';
import { AppHeader, topBarStyles } from '../../../components/AppHeader';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { AppButton } from '../../../components/AppButton';
import { UiAssetIcon } from '../../../components/UiAssetIcon';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import type { OnboardingStep } from '../types';
import { styles } from './onboardingFlowStyles';

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
  const s = copyFor(language);
  const title = step === 'safe-foods'
    ? s.onboarding.safeFoodsTitle(childName || s.onboarding.childFallback)
    : step === 'review'
      ? s.onboarding.reviewTitle(childName || s.onboarding.childFallback)
      : s.onboarding.titles[step];
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AppHeader title={title} />
        <View style={topBarStyles.details}>
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
          <Text style={styles.subtitle}>{step === "safe-foods" ? s.onboarding.safeFoodsDescription(childName || s.onboarding.childFallback) : s.onboarding.subtitles[step]}</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {content}
          {saveStatus === 'error' && <AppButton label={s.common.retry} compact secondary onPress={onRetrySave} style={styles.retry} />}
        </ScrollView>
        <View style={styles.footer}>
          {step !== 'account' && (step !== 'consent' || canContinue) && <AppButton label={previousLabel ?? s.common.previous} secondary onPress={onPrevious} style={styles.previous} />}
          <AppButton
            label={continueLabel ?? (step === 'review' ? s.onboarding.looksGood : s.common.continue)}
            disabled={submitting || !canContinue}
            onPress={onContinue}
            style={styles.next}
          />
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
