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
  content, onPrevious, onContinue, onRetrySave,
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
  onPrevious: () => void;
  onContinue: () => void;
  onSaveExit: () => void;
  onRetrySave: () => void;
}) {
  const s = copyFor(language);
  const sensory = ['texture', 'smell', 'taste', 'presentation', 'temperature'].includes(step);
  const title = step === 'safe-foods'
    ? s.onboarding.safeFoodsTitle(childName || s.onboarding.childFallback)
    : step === 'review'
      ? s.onboarding.reviewTitle(childName || s.onboarding.childFallback)
      : s.onboarding.titles[step];
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
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
          {sensory && <Text style={styles.sensoryTitle}>{title}</Text>}
          <View style={styles.track}><View style={[styles.fill, { width: `${((stepIndex + 1) / stepCount) * 100}%` }]} /></View>
          {!sensory && <Text style={styles.title}>{title}</Text>}
          {!sensory && <Text style={styles.subtitle}>{s.onboarding.subtitles[step]}</Text>}
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {content}
          {saveStatus === 'error' && <AppButton label={s.common.retry} compact secondary onPress={onRetrySave} style={styles.retry} />}
        </ScrollView>
        <View style={styles.footer}>
          <AppButton label={s.common.previous} secondary onPress={onPrevious} style={styles.previous} />
          <AppButton
            label={step === 'review' ? s.onboarding.looksGood : s.common.continue}
            disabled={submitting || !canContinue}
            onPress={onContinue}
            style={styles.next}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
