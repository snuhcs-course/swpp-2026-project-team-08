import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { AppButton } from '../../../components/AppButton';
import { useFontReady } from '../../../components/FontReadyContext';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { copyFor } from '../../../util/strings';
import { nextStep, previousStep, useOnboarding } from '../hooks/useOnboarding';
import { isStep, steps, type OnboardingStep } from '../types';
import { OnboardingStepView } from './OnboardingStepView';

export function OnboardingScreen({ routeStep, from }: { routeStep: string; from?: string }) {
  const model = useOnboarding();
  const fontReady = useFontReady();
  const [submitting, setSubmitting] = useState(false);
  const step = typeof routeStep === 'string' && isStep(routeStep) ? routeStep : model.draft.step;
  const s = copyFor(model.language);
  const index = steps.indexOf(step);

  const navigate = (target: OnboardingStep, returnToReview = false) => {
    model.setStep(target);
    router.replace({ pathname: '/onboarding/[step]', params: { step: target, ...(returnToReview ? { from: 'review' } : {}) } });
  };
  const handlePrevious = () => {
    if (from === 'review') navigate('review');
    else if (index === 0) router.replace('/');
    else navigate(previousStep(step));
  };
  const handleContinue = async () => {
    if (submitting || !model.canContinue(step)) return;
    if (step === 'review') {
      setSubmitting(true);
      const saved = await model.finish();
      setSubmitting(false);
      if (saved) router.replace('/home');
    } else if (from === 'review') navigate('review');
    else navigate(nextStep(step));
  };
  const handleSaveExit = async () => {
    try { await model.retrySave(); router.replace('/'); } catch { /* The save status shows the error. */ }
  };

  if (!fontReady || !model.ready) return <View style={styles.root} />;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{s.onboarding.progress(index + 1, steps.length)}</Text>
            <View style={styles.headerRight}>
              <Feather name="cloud" size={13} color={model.saveStatus === 'error' ? colors.error : colors.success} />
              <Text style={[styles.saveText, model.saveStatus === 'error' && styles.saveError]}>{model.saveStatus === 'saving' ? s.common.saving : model.saveStatus === 'error' ? s.common.saveFailed : s.common.saved}</Text>
            </View>
          </View>
          <View style={styles.track}><View style={[styles.fill, { width: `${((index + 1) / steps.length) * 100}%` }]} /></View>
          <Text style={styles.title}>{s.onboarding.titles[step]}</Text>
          <Text style={styles.subtitle}>{s.onboarding.subtitles[step]}</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <OnboardingStepView key={step} step={step} model={model} onEditStep={(target) => navigate(target, true)} />
          {step === 'safe-foods' && <AppButton label={s.common.saveExit} secondary onPress={() => void handleSaveExit()} style={styles.saveExit} />}
          {model.saveStatus === 'error' && <AppButton label={s.common.retry} compact secondary onPress={() => void model.retrySave()} style={styles.retry} />}
        </ScrollView>
        <View style={styles.footer}>
          <AppButton label={s.common.previous} secondary onPress={handlePrevious} style={styles.previous} />
          <AppButton label={step === 'review' ? s.onboarding.looksGood : s.common.continue} disabled={submitting || !model.canContinue(step)} onPress={() => void handleContinue()} style={styles.next} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onboardingBackground },
  flex: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 0 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  progressText: { color: colors.onboardingPrimary, fontSize: 9, fontFamily: fonts.interExtraBold },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  saveText: { color: colors.success, fontSize: 8, fontFamily: fonts.interBold, flexShrink: 1 },
  saveError: { color: colors.error },
  track: { height: 3, borderRadius: 999, backgroundColor: colors.progressTrack, marginTop: 6, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 999, backgroundColor: colors.onboardingPrimary },
  title: { color: colors.onboardingText, fontSize: 20, fontFamily: fonts.interBold, marginTop: 5, lineHeight: 22 },
  subtitle: { color: colors.onboardingMuted, fontSize: 10, fontFamily: fonts.interRegular, lineHeight: 14, marginTop: 2 },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 30 },
  saveExit: { marginTop: 16 },
  retry: { marginTop: 10 },
  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 5, minHeight: 77, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.onboardingBorder, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  previous: { width: 96 },
  next: { flex: 1 },
});
