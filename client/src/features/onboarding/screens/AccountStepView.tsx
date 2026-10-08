import { View } from 'react-native';
import { FormField } from '../../../components/FormField';
import { copyFor } from '../../../util/strings';
import type { OnboardingContextValue } from '../hooks/useOnboarding';

export function AccountStepView({ model, emailError, passwordError }: {
  model: OnboardingContextValue;
  emailError?: string;
  passwordError?: string;
}) {
  const { draft, password } = model;
  const s = copyFor(model.language);
  return (
    <View>
      <FormField
        label={s.onboarding.caregiverName}
        value={draft.caregiverName}
        onChangeText={(value) => model.setField('caregiverName', value)}
      />
      <FormField
        label={s.onboarding.email}
        value={draft.caregiverEmail}
        onChangeText={(value) => model.setField('caregiverEmail', value)}
        keyboardType="email-address"
        autoCapitalize="none"
        error={emailError}
      />
      {!model.editing && (
        <FormField
          label={s.onboarding.password}
          value={password}
          onChangeText={model.setPassword}
          secureTextEntry
          autoCapitalize="none"
          error={passwordError}
        />
      )}
    </View>
  );
}
