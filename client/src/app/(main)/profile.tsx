import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { useOnboarding } from '../../features/onboarding/hooks/useOnboarding';
import { colors } from '../../util/colors';
import { copyFor, labelFor } from '../../util/strings';

export default function ProfileScreen() {
  const model = useOnboarding();
  if (!model.ready) return <View style={styles.root} />;
  if (!model.profile) return <Redirect href="/" />;
  const s = copyFor(model.language);
  const profile = model.profile;
  return <View style={styles.root}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}><Text style={styles.title}>{s.home.profileTitle}</Text><Pressable onPress={() => model.setLanguage(model.language === 'ko' ? 'en' : 'ko')} accessibilityRole="button"><Text style={styles.language}>{s.common.language}</Text></Pressable></View>
      <View style={styles.card}><Text style={styles.label}>{s.home.caregiver}</Text><Text style={styles.value}>{profile.caregiverName}</Text><Text style={styles.detail}>{profile.caregiverEmail}</Text></View>
      <View style={styles.card}><Text style={styles.label}>{s.home.child}</Text><Text style={styles.value}>{profile.childName}</Text><Text style={styles.detail}>{labelFor('age', profile.ageRange, model.language)}</Text></View>
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
