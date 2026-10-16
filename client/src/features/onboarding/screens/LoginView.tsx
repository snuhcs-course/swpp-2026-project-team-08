// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { FormField } from '../../../components/FormField';
import type { Language } from '../../../types/profile';
import { copyFor } from '../../../util/strings';
import { styles as entry } from './entryStyles';

export function LoginView({
  language,
  email,
  password,
  emailError,
  passwordError,
  formError,
  submitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onCreateAccount,
}: {
  language: Language;
  email: string;
  password: string;
  emailError?: string;
  passwordError?: string;
  formError?: string;
  submitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onCreateAccount: () => void;
}) {
  const s = copyFor(language);
  return (
    <SafeAreaView style={entry.root}>
      <View style={entry.body}>
        <Text style={entry.brand}>{s.common.brand}</Text>
        <Text style={entry.title}>{s.onboarding.loginTitle}</Text>
        <Text style={entry.subtitle}>{s.onboarding.loginSubtitle}</Text>
        <FormField
          label={s.onboarding.email}
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          error={emailError}
        />
        <FormField
          label={s.onboarding.password}
          value={password}
          onChangeText={onPasswordChange}
          secureTextEntry
          autoCapitalize="none"
          error={passwordError}
        />
        {formError ? <Text style={entry.error}>{formError}</Text> : null}
      </View>
      <AppButton label={s.onboarding.logIn} disabled={submitting} onPress={onSubmit} />
      <Pressable accessibilityRole="button" onPress={onCreateAccount} style={entry.linkWrap}>
        <Text style={entry.link}>{s.onboarding.noAccount}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
