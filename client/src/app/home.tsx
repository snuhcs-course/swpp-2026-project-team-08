import { Redirect, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { useOnboarding } from '../features/onboarding/hooks/useOnboarding';
import { colors } from '../util/colors';
import { copyFor } from '../util/strings';

export default function HomeScreen() {
  const model = useOnboarding();
  const s = copyFor(model.language);
  if (!model.ready) return <SafeAreaView style={styles.root}><ActivityIndicator color={colors.homePrimary} /></SafeAreaView>;
  if (!model.profile) return <Redirect href="/" />;
  return <SafeAreaView style={styles.root}>
    <View style={styles.content}>
      <Text style={styles.title}>{s.home.today}</Text>
      <Text style={styles.child}>{model.profile.childName}</Text>
      <Text style={styles.description}>{s.onboarding.localOnly}</Text>
      <AppButton label={s.home.editProfile} onPress={() => { model.startEdit(); router.push({ pathname: '/onboarding/[step]', params: { step: 'review' } }); }} />
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  content: { flex: 1, justifyContent: 'center', gap: 12, padding: 24 },
  title: { color: colors.homeText, fontSize: 24, fontWeight: '800' },
  child: { color: colors.homePrimary, fontSize: 18, fontWeight: '700' },
  description: { color: colors.homeMuted, fontSize: 13, lineHeight: 19 },
});
