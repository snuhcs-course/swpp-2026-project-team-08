// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 온보딩 중 다른 계정 로그인
// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: 불러오기 오류 문구 구분
// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가

import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor, strings } from '../../../util/strings';
import { useOnboarding } from '../hooks/useOnboarding';
import { styles } from './entryStyles';

export function EntryScreen() {
  const model = useOnboarding();
  const profile = useProfile();
  const auth = useAuth();
  const s = copyFor(profile.language);
  const [switchError, setSwitchError] = useState(false);
  const [switching, setSwitching] = useState(false);
  const switchInFlight = useRef(false);
  const switchAccount = async () => {
    if (switchInFlight.current) return;
    switchInFlight.current = true;
    setSwitching(true);
    setSwitchError(false);
    try {
      await model.archiveForAccountSwitch();
      await auth.signOut();
      router.replace('/login');
    } catch {
      try { await model.restoreAfterSignIn(); } catch { /* Keep the saved copy for the next sign-in. */ }
      setSwitchError(true);
    }
    finally { switchInFlight.current = false; setSwitching(false); }
  };
  if (auth.status === 'loading' || !model.ready) return (
    <SafeAreaView style={styles.root}><ActivityIndicator color={colors.onboardingPrimary} /><Text style={styles.loading}>{s.common.loading}</Text></SafeAreaView>
  );
  if (profile.status === 'error' || model.loadError) return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.brand}>{s.common.brand}</Text>
        <Text style={styles.error}>{profile.language === 'ko' ? strings.ko.common.loadFailed : s.common.saveFailed}</Text>
      </View>
      <AppButton label={s.common.retry} onPress={() => {
        if (profile.status === 'error') void profile.retryLoad();
        else model.retryLoad();
      }} />
    </SafeAreaView>
  );
  if (auth.session && profile.profile) return <Redirect href="/home" />;
  if (auth.session && !profile.profile) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.body}>
          <Text style={styles.brand}>{s.common.brand}</Text>
          <Text style={styles.title}>{s.onboarding.titles.account}</Text>
        </View>
        <View style={styles.actions}>
          <AppButton
            label={model.hasDraft ? s.onboarding.resume : s.onboarding.start}
            disabled={switching}
            onPress={() => router.push({ pathname: '/onboarding/[step]', params: { step: model.hasDraft ? model.draft.step : 'consent' } })}
          />
          {model.hasDraft && <Pressable accessibilityRole="button" disabled={switching}
            onPress={() => { void switchAccount(); }} style={styles.linkWrap}>
            <Text style={styles.link}>{s.onboarding.signInAnother}</Text>
          </Pressable>}
          {switchError && <Text accessibilityRole="alert" style={styles.error}>{s.common.saveFailed}</Text>}
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.brand}>{s.common.brand}</Text>
        <Text style={styles.title}>{s.onboarding.titles.account}</Text>
      </View>
      <View style={styles.actions}>
        <AppButton label={s.onboarding.start} labelStyle={styles.actionLabel} onPress={() => router.push({ pathname: '/onboarding/[step]', params: { step: 'account' } })} />
        <AppButton secondary label={s.onboarding.logIn} labelStyle={styles.actionLabel} onPress={() => router.push('/login')} />
      </View>
    </SafeAreaView>
  );
}
