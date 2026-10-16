// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { Text, View } from 'react-native';
import { FormField } from '../../../components/FormField';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';

export function AccountStepView({ language, caregiverName, email, password, editing, emailError, passwordError, formError, onNameChange, onEmailChange, onPasswordChange }: {
  language: 'ko' | 'en';
  caregiverName: string;
  email: string;
  password: string;
  editing: boolean;
  emailError?: string;
  passwordError?: string;
  formError?: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}) {
  const s = copyFor(language);
  return (
    <View>
      <FormField
        label={s.onboarding.caregiverName}
        value={caregiverName}
        onChangeText={onNameChange}
      />
      <FormField
        label={s.onboarding.email}
        value={email}
        onChangeText={onEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        error={emailError}
      />
      {!editing && (
        <FormField
          label={s.onboarding.password}
          value={password}
          onChangeText={onPasswordChange}
          secureTextEntry
          autoCapitalize="none"
          error={passwordError}
        />
      )}
      {formError ? <Text style={{ color: colors.error, fontSize: 12, marginTop: 8 }}>{formError}</Text> : null}
    </View>
  );
}
