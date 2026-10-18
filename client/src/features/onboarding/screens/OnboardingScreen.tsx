// AI-generated with Grok 4.6, 2026-10-17, reviewed by Doyeon Kim

import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useFontReady } from '../../../components/FontReadyContext';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useOnboarding } from '../hooks/useOnboarding';
import { onboardingRouteParams } from '../navigation';
import { canAddSafeFood, matchingSafeFoods, validEmail, validPassword } from '../rules';
import { isStep, nextStep, previousStep, steps, type OnboardingStep } from '../types';
import { AccountStepView } from './AccountStepView';
import { ChoiceStepView, type ChoiceStep } from './ChoiceStepView';
import { ConsentStepView } from './ConsentStepView';
import { OnboardingFlowView } from './OnboardingFlowView';
import { ReviewStepView } from './ReviewStepView';
import { SafeFoodsStepView } from './SafeFoodsStepView';
import { reviewRows } from './reviewRows';

const choiceSteps: ChoiceStep[] = [
  'child', 'allergies', 'restrictions', 'family', 'approaches',
  'texture', 'smell', 'taste', 'presentation', 'temperature', 'familiarity',
];

export function OnboardingScreen({ routeStep, from }: { routeStep: string; from?: string }) {
  const model = useOnboarding();
  const auth = useAuth();
  const { language } = useProfile();
  const fontReady = useFontReady();
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | undefined>();
  const step = typeof routeStep === 'string' && isStep(routeStep) ? routeStep : model.draft.step;
  const s = copyFor(language);
  const index = steps.indexOf(step);

  const origin = typeof from === 'string' ? from : undefined;
  const navigate = (target: OnboardingStep, returnTo = origin) => {
    model.setStep(target);
    router.replace({
      pathname: '/onboarding/[step]',
      params: onboardingRouteParams(target, returnTo),
    });
  };
  const handlePrevious = () => {
    if (origin === 'child-profile') {
      void model.cancelEdit().then(() => router.back());
      return;
    }
    if (origin === 'review') navigate('review');
    else if (index === 0) router.replace('/');
    else navigate(previousStep(step));
  };
  const handleContinue = async () => {
    if (submitting || !model.canContinue(step)) return;
    if (origin === 'child-profile') {
      if (step === 'allergies') {
        navigate('restrictions', 'child-profile');
        return;
      }
      setSubmitting(true);
      const saved = await model.applyEdit();
      setSubmitting(false);
      if (saved) router.back();
      return;
    }
    if (step === 'account' && !model.editing && !auth.session) {
      setSubmitting(true);
      setAuthError(undefined);
      const result = await auth.signUp({
        email: model.draft.caregiverEmail,
        password: model.password,
        fullName: model.draft.caregiverName,
      });
      setSubmitting(false);
      if (!result.ok) {
        setAuthError(result.error === 'email-taken' ? s.onboarding.emailTaken
          : result.error === 'network' ? s.onboarding.authNetwork
            : s.onboarding.signupFailed);
        return;
      }
    }
    if (step === 'review') {
      setSubmitting(true);
      const saved = await model.finish();
      setSubmitting(false);
      if (saved) router.replace('/home');
    } else if (origin === 'review') navigate('review');
    else navigate(nextStep(step));
  };
  const handleSaveExit = async () => {
    try { await model.retrySave(); router.replace('/'); } catch { /* The save status shows the error. */ }
  };
  const renderStep = () => {
    if (step === 'account') return (
      <AccountStepView
        language={language}
        caregiverName={model.draft.caregiverName}
        email={model.draft.caregiverEmail}
        password={model.password}
        editing={model.editing}
        emailError={model.draft.caregiverEmail && !validEmail(model.draft.caregiverEmail) ? s.onboarding.emailHint : undefined}
        passwordError={model.password && !validPassword(model.password) ? s.onboarding.passwordHint : undefined}
        formError={authError}
        onNameChange={(value) => model.setField('caregiverName', value)}
        onEmailChange={(value) => model.setField('caregiverEmail', value)}
        onPasswordChange={model.setPassword}
      />
    );
    if (step === 'consent') return (
      <ConsentStepView
        consent={model.draft.consent}
        language={language}
        onToggle={(key) => model.setConsent(key, !model.draft.consent[key])}
      />
    );
    if (step === 'safe-foods') return (
      <SafeFoodsStepView
        language={language}
        safeFoods={model.draft.safeFoods}
        noSafeFoods={model.draft.noSafeFoods}
        input={model.draft.safeFoodInput}
        canAdd={canAddSafeFood(model.draft.safeFoodInput)}
        onToggleNone={() => model.setNoSafeFoods(!model.draft.noSafeFoods)}
        onRemove={model.removeSafeFood}
        onInputChange={model.setSafeFoodInput}
        onAdd={() => model.addSafeFood(model.draft.safeFoodInput)}
      />
    );
    if (step === 'review') return (
      <ReviewStepView
        rows={reviewRows(model.draft, language)}
        conflicts={matchingSafeFoods(model.draft, language)}
        editLabel={s.common.edit}
        conflictLabel={s.onboarding.conflict}
        onEditStep={(target) => navigate(target, 'review')}
      />
    );
    if (choiceSteps.includes(step as ChoiceStep)) return (
      <ChoiceStepView
        key={step}
        step={step as ChoiceStep}
        values={model.draft}
        language={language}
        onSetField={model.setField}
        onToggleList={model.toggleList}
        onAddListItem={model.addListItem}
        onRemoveListItem={model.removeListItem}
      />
    );
    return null;
  };

  if (!fontReady || !model.ready) return <View style={{ flex: 1, backgroundColor: colors.onboardingBackground }} />;

  return (
    <OnboardingFlowView
      language={language}
      step={step}
      stepIndex={index}
      stepCount={steps.length}
      childName={model.draft.childName}
      saveStatus={model.saveStatus}
      submitting={submitting}
      canContinue={model.canContinue(step)}
      content={renderStep()}
      onPrevious={handlePrevious}
      onContinue={() => { void handleContinue(); }}
      onSaveExit={() => { void handleSaveExit(); }}
      onRetrySave={() => { void model.retrySave(); }}
    />
  );
}
