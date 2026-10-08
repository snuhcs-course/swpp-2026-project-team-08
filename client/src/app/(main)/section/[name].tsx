import { Redirect, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import type { HomeTab } from '../../../features/home/components/BottomNavigation';
import { useOnboarding } from '../../../features/onboarding/hooks/useOnboarding';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';

const sections: HomeTab[] = ['mealLog', 'sos', 'ideas', 'insight'];

export default function SectionScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const model = useOnboarding();
  if (!model.ready) return <View style={styles.root} />;
  if (!model.profile) return <Redirect href="/" />;
  if (!sections.includes(name as HomeTab)) return <Redirect href="/home" />;
  const selected = name as HomeTab;
  const s = copyFor(model.language);
  return <View style={styles.root}>
    <View style={styles.content}><Text style={styles.title}>{s.home[selected]}</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  content: { flex: 1, padding: 24, gap: 12 },
  title: { color: colors.homeText, fontSize: 24, fontWeight: '800' },
});
