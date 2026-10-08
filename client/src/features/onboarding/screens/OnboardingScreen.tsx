import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useFontReady } from '../../../components/FontReadyContext';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { nextStep, previousStep, useOnboarding } from '../hooks/useOnboarding';
import { canAddSafeFood, matchingSafeFoods, validEmail, validPassword } from '../rules';
import { isStep, steps, type OnboardingStep } from '../types';
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
  const renderStep = () => {
    if (step === 'account') return (
      <AccountStepView
        language={model.language}
        caregiverName={model.draft.caregiverName}
        email={model.draft.caregiverEmail}
        password={model.password}
        editing={model.editing}
        emailError={model.draft.caregiverEmail && !validEmail(model.draft.caregiverEmail) ? s.onboarding.emailHint : undefined}
        passwordError={model.password && !validPassword(model.password) ? s.onboarding.passwordHint : undefined}
        onNameChange={(value) => model.setField('caregiverName', value)}
        onEmailChange={(value) => model.setField('caregiverEmail', value)}
        onPasswordChange={model.setPassword}
      />
    );
    if (step === 'consent') return (
      <ConsentStepView
        consent={model.draft.consent}
        language={model.language}
        onToggle={(key) => model.setConsent(key, !model.draft.consent[key])}
      />
    );
    if (step === 'safe-foods') return (
      <SafeFoodsStepView
        language={model.language}
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
        rows={reviewRows(model.draft, model.language)}
        conflicts={matchingSafeFoods(model.draft, model.language)}
        editLabel={s.common.edit}
        conflictLabel={s.onboarding.conflict}
        onEditStep={(target) => navigate(target, true)}
      />
    );
    if (choiceSteps.includes(step as ChoiceStep)) return (
      <ChoiceStepView
        key={step}
        step={step as ChoiceStep}
        values={model.draft}
        language={model.language}
        onSetField={model.setField}
        onToggleList={model.toggleList}
        onAddListItem={model.addListItem}
        onRemoveListItem={model.removeListItem}
        onSetList={model.setList}
      />
    );
    return null;
  };

  if (!fontReady || !model.ready) return <View style={{ flex: 1, backgroundColor: colors.onboardingBackground }} />;

  return (
    <OnboardingFlowView
      language={model.language}
      step={step}
      stepIndex={index}
      stepCount={steps.length}
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
