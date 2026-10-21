// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';
import { useOnboarding } from '../hooks/useOnboarding';
import { validEmail, validPassword } from '../rules';
import { LoginView } from './LoginView';
import { styles } from './entryStyles';

export function LoginScreen() {
  const auth = useAuth();
  const profile = useProfile();
  const onboarding = useOnboarding();
  const s = copyFor(profile.language);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  if (auth.status === 'loading' || profile.status === 'loading' || !onboarding.ready) {
    return (
      <SafeAreaView style={styles.root}>
        <ActivityIndicator color={colors.onboardingPrimary} />
      </SafeAreaView>
    );
  }
  if (auth.session && profile.status === 'error') return <Redirect href="/" />;
  if (auth.session && profile.profile) return <Redirect href="/home" />;
  if (auth.session && !profile.profile) {
    return <Redirect href={{ pathname: '/onboarding/[step]', params: { step: onboarding.hasDraft ? onboarding.draft.step : 'consent' } }} />;
  }

  const submit = async () => {
    if (submitting || !validEmail(email) || !validPassword(password)) return;
    setSubmitting(true);
    setFormError(undefined);
    const result = await auth.signIn({ email, password });
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error === 'invalid-credentials' ? s.onboarding.loginFailed
        : result.error === 'network' ? s.onboarding.authNetwork
          : s.onboarding.signupFailed);
      return;
    }
  };

  return (
    <LoginView
      language={profile.language}
      email={email}
      password={password}
      emailError={email && !validEmail(email) ? s.onboarding.emailHint : undefined}
      passwordError={password && !validPassword(password) ? s.onboarding.passwordHint : undefined}
      formError={formError}
      submitting={submitting}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={() => { void submit(); }}
      onCreateAccount={() => router.replace({ pathname: '/onboarding/[step]', params: { step: 'account' } })}
    />
  );
}
