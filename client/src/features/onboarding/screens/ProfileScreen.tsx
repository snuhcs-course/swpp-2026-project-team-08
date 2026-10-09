// This Code is generated with AI

import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor, labelFor } from '../../../util/strings';
import { useOnboarding } from '../hooks/useOnboarding';

export function ProfileScreen() {
  const model = useOnboarding();
  const appProfile = useProfile();
  const [languageError, setLanguageError] = useState(false);
  if (appProfile.status === 'loading' || !model.ready) return <View style={styles.root} />;
  if (appProfile.status === 'error' || model.loadError || !appProfile.profile) return <Redirect href="/" />;
  const s = copyFor(appProfile.language);
  const profile = appProfile.profile;
  return <View style={styles.root}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}><Text style={styles.title}>{s.home.profileTitle}</Text><Pressable onPress={() => {
        void appProfile.changeLanguage(appProfile.language === 'ko' ? 'en' : 'ko').then(
          () => setLanguageError(false), () => setLanguageError(true),
        );
      }} accessibilityRole="button"><Text style={styles.language}>{s.common.language}</Text></Pressable></View>
      {languageError && <Text style={{ color: colors.error }}>{s.common.saveFailed}</Text>}
      <View style={styles.card}><Text style={styles.label}>{s.home.caregiver}</Text><Text style={styles.value}>{profile.caregiverName}</Text><Text style={styles.detail}>{profile.caregiverEmail}</Text></View>
      <View style={styles.card}><Text style={styles.label}>{s.home.child}</Text><Text style={styles.value}>{profile.childName}</Text><Text style={styles.detail}>{labelFor('age', profile.ageRange, appProfile.language)}</Text></View>
      <AppButton label={s.home.editProfile} onPress={() => { model.startEdit(); router.push({ pathname: '/onboarding/[step]', params: { step: 'review' } }); }} />
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  content: { padding: 24, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { color: colors.homeText, fontSize: 24, fontWeight: '800' },
  language: { color: colors.homePrimary, fontSize: 13, fontWeight: '800' },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.homeBorder, gap: 4 },
  label: { color: colors.homeMuted, fontSize: 11, fontWeight: '700' },
  value: { color: colors.homeText, fontSize: 18, fontWeight: '800' },
  detail: { color: colors.homeMuted, fontSize: 12 },
});
