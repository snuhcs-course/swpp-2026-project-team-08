import { View } from 'react-native';
import { FormField } from '../../../components/FormField';
import { copyFor } from '../../../util/strings';

export function AccountStepView({ language, caregiverName, email, password, editing, emailError, passwordError, onNameChange, onEmailChange, onPasswordChange }: {
  language: 'ko' | 'en';
  caregiverName: string;
  email: string;
  password: string;
  editing: boolean;
  emailError?: string;
  passwordError?: string;
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
    </View>
  );
}
