// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화

import { AppHeader } from '../../../components/AppHeader';
import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import type { HomeTab } from '../../../components/BottomNavigation';
import { useProfile } from '../../../providers/ProfileProvider';
import { colors } from '../../../util/colors';
import { copyFor } from '../../../util/strings';

const sections: HomeTab[] = ['mealLog', 'ideas', 'insight'];

export function SectionScreen({ name }: { name: string }) {
  const model = useProfile();
  if (model.status === 'loading') return <View style={styles.root} />;
  if (model.status === 'error' || !model.profile) return <Redirect href="/" />;
  if (!sections.includes(name as HomeTab)) return <Redirect href="/home" />;
  const selected = name as HomeTab;
  const s = copyFor(model.language);
  return <View style={styles.root}>
    <AppHeader title={s.home[selected]} />
    <View style={styles.content} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  content: { flex: 1, padding: 24, gap: 12 },
});
