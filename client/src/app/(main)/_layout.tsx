// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Let visible bottom navigation own the bottom safe area

import { router, Stack, usePathname, useGlobalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeNavigationScreen } from '../../features/home/screens/HomeNavigationScreen';
import { tabOrder, type HomeTab } from '../../components/BottomNavigation';
import { useFontReady } from '../../components/FontReadyContext';
import { colors } from '../../util/colors';

function tabFromPath(pathname: string): HomeTab {
  if (pathname === '/profile') return 'profile';
  const section = pathname.split('/')[2];
  if (pathname.startsWith('/section/') && tabOrder.includes(section as HomeTab)) return section as HomeTab;
  return 'today';
}

export default function MainLayout() {
  const pathname = usePathname();
  const { suggestionFlow } = useGlobalSearchParams<{ suggestionFlow?: string }>();
  const fontReady = useFontReady();
  const selected = tabFromPath(pathname);
  const showNavigation = !(selected === 'ideas' && suggestionFlow === 'record');

  const onSelect = (tab: HomeTab) => {
    if (tab === selected) return;
    const tabDirection = tabOrder.indexOf(tab) > tabOrder.indexOf(selected) ? 'right' : 'left';
    if (tab === 'today') router.replace({ pathname: '/home', params: { tabDirection } });
    else if (tab === 'profile') router.replace({ pathname: '/profile', params: { tabDirection } });
    else router.replace({ pathname: '/section/[name]', params: { name: tab, tabDirection } });
  };

  if (!fontReady) return <View style={styles.root} />;

  return <SafeAreaView style={styles.root} edges={showNavigation ? ['top'] : ['top', 'bottom']}>
    <View style={styles.content}>
      {/* JS stack animations call InteractionManager APIs removed in RN 0.86. */}
      <Stack screenOptions={({ route }) => ({
        headerShown: false,
        gestureEnabled: false,
        animation: (route.params as { tabDirection?: string } | undefined)?.tabDirection === 'left'
          ? 'slide_from_left' : 'slide_from_right',
        animationTypeForReplace: 'push',
        animationDuration: 260,
        contentStyle: { backgroundColor: colors.homeBackground },
      })} />
    </View>
    {showNavigation && <HomeNavigationScreen selected={selected} onSelect={onSelect} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  content: { flex: 1, backgroundColor: colors.homeBackground },
});
