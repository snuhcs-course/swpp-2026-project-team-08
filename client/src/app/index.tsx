import { Redirect, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../components/AppButton';
import { useOnboarding } from '../features/onboarding/hooks/useOnboarding';
import { colors } from '../util/colors';
import { copyFor } from '../util/strings';

export default function EntryScreen() {
  const model = useOnboarding();
  const s = copyFor(model.language);
  if (!model.ready) return (
    <SafeAreaView style={styles.root}><ActivityIndicator color={colors.onboardingPrimary} /><Text style={styles.loading}>{s.common.loading}</Text></SafeAreaView>
  );
  if (model.profile) return <Redirect href="/home" />;
  if (!model.hasDraft && !model.loadError) return <Redirect href={{ pathname: '/onboarding/[step]', params: { step: 'account' } }} />;
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.brand}>{s.common.brand}</Text>
        <Text style={styles.title}>{s.onboarding.titles.account}</Text>
        {model.loadError && <Text style={styles.error}>{s.common.saveFailed}</Text>}
      </View>
      <AppButton label={model.hasDraft ? s.onboarding.resume : s.onboarding.start} onPress={() => router.push({ pathname: '/onboarding/[step]', params: { step: model.draft.step } })} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onboardingBackground, paddingHorizontal: 24, paddingBottom: 25 },
  body: { flex: 1, justifyContent: 'center', gap: 14 },
  brand: { color: colors.onboardingPrimary, fontSize: 16, fontWeight: '800' },
  title: { color: colors.onboardingText, fontSize: 28, fontWeight: '800' },
  loading: { color: colors.onboardingMuted, marginTop: 12 },
  error: { color: colors.error, fontSize: 13 },
});
