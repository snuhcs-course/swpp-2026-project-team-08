import { copyFor } from '../../../util/strings';
import { canAddSafeFood, matchingSafeFoods, validEmail, validPassword } from '../rules';
import type { OnboardingContextValue } from '../hooks/useOnboarding';
import type { OnboardingStep } from '../types';
import { AccountStepView } from './AccountStepView';
import { ChoiceStepView, type ChoiceStep } from './ChoiceStepView';
import { ConsentStepView } from './ConsentStepView';
import { ReviewStepView } from './ReviewStepView';
import { SafeFoodsStepView } from './SafeFoodsStepView';
import { reviewRows } from './reviewRows';

const choiceSteps: ChoiceStep[] = [
  'child', 'allergies', 'restrictions', 'family', 'approaches',
  'texture', 'smell', 'taste', 'presentation', 'temperature', 'familiarity',
];

export function OnboardingStepView({
  step,
  model,
  onEditStep,
}: {
  step: OnboardingStep;
  model: OnboardingContextValue;
  onEditStep: (step: OnboardingStep) => void;
}) {
  if (step === 'account') {
    const s = copyFor(model.language);
    return (
      <AccountStepView
        model={model}
        emailError={model.draft.caregiverEmail && !validEmail(model.draft.caregiverEmail) ? s.onboarding.emailHint : undefined}
        passwordError={model.password && !validPassword(model.password) ? s.onboarding.passwordHint : undefined}
      />
    );
  }
  if (step === 'consent') return <ConsentStepView model={model} />;
  if (step === 'safe-foods') return <SafeFoodsStepView model={model} canAdd={canAddSafeFood(model.draft.safeFoodInput)} />;
  if (step === 'review') {
    const s = copyFor(model.language);
    return (
      <ReviewStepView
        rows={reviewRows(model.draft, model.language)}
        conflicts={matchingSafeFoods(model.draft, model.language)}
        editLabel={s.common.edit}
        conflictLabel={s.onboarding.conflict}
        onEditStep={onEditStep}
      />
    );
  }
  if (choiceSteps.includes(step as ChoiceStep)) {
    return <ChoiceStepView step={step as ChoiceStep} model={model} />;
  }
  return null;
}
