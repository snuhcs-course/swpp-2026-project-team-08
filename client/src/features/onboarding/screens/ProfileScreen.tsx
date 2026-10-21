// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
import { AppHeader, topBarStyles } from '../../../components/AppHeader';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { useAuth } from '../../../providers/AuthProvider';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor, labelFor } from '../../../util/strings';
import type { OnboardingStep } from '../types';
import { useOnboarding } from '../hooks/useOnboarding';

export function ProfileScreen() {
  const model = useOnboarding();
  const auth = useAuth();
  const appProfile = useProfile();
  const [languageError, setLanguageError] = useState(false);
  if (appProfile.status === 'loading' || !model.ready) return <View style={styles.root} />;
  if (appProfile.status === 'error' || model.loadError || !appProfile.profile) return <Redirect href="/" />;
  const s = copyFor(appProfile.language);
  const profile = appProfile.profile;
  return <View style={styles.root}>
      <AppHeader title={s.home.profileTitle} accessory={<Pressable onPress={() => {
        void appProfile.changeLanguage(appProfile.language === 'ko' ? 'en' : 'ko').then(
          () => setLanguageError(false), () => setLanguageError(true),
        );
      }} accessibilityRole="button"><Text style={styles.language}>{s.common.language}</Text></Pressable>} />
    <ScrollView contentContainerStyle={styles.content}>

      {languageError && <Text style={{ color: colors.error }}>{s.common.saveFailed}</Text>}
      <View style={styles.card}><Text style={styles.label}>{s.home.caregiver}</Text><Text style={styles.value}>{profile.caregiverName}</Text><Text style={styles.detail}>{profile.caregiverEmail}</Text></View>
      <View style={styles.card}><Text style={styles.label}>{s.home.child}</Text><Text style={styles.value}>{profile.childName}</Text><Text style={styles.detail}>{labelFor('age', profile.ageRange, appProfile.language)}</Text></View>
      <AppButton label={s.home.editProfile} onPress={() => { model.startEdit(); router.push({ pathname: '/onboarding/[step]', params: { step: 'review' } }); }} />
      {(['texture', 'smell', 'taste', 'presentation', 'temperature', 'familiarity'] as const).map((step: OnboardingStep) => <AppButton key={step} secondary label={s.onboarding.titles[step]} onPress={() => { model.startEdit(); router.push({ pathname: '/onboarding/[step]', params: { step } }); }} />)}
      <AppButton secondary label={s.onboarding.logOut} onPress={() => { void auth.signOut().then(() => router.replace('/')); }} />
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  content: { ...topBarStyles.content, paddingBottom: 24, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { color: colors.homeText, fontSize: 24, fontWeight: '800' },
  language: { color: colors.homePrimary, fontSize: 13, fontWeight: '800' },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.homeBorder, gap: 4 },
  label: { color: colors.homeMuted, fontSize: 11, fontWeight: '700' },
  value: { color: colors.homeText, fontSize: 18, fontWeight: '800' },
  detail: { color: colors.homeMuted, fontSize: 12 },
});
