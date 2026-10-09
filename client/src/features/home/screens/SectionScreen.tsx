// This Code is generated with AI

import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import type { HomeTab } from '../../../components/BottomNavigation';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';

const sections: HomeTab[] = ['mealLog', 'sos', 'ideas', 'insight'];

export function SectionScreen({ name }: { name: string }) {
  const model = useProfile();
  if (model.status === 'loading') return <View style={styles.root} />;
  if (model.status === 'error' || !model.profile) return <Redirect href="/" />;
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
