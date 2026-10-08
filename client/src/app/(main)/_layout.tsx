import { router, Stack, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavigation, tabOrder, type HomeTab } from '../../components/BottomNavigation';
import { useFontReady } from '../../components/FontReadyContext';
import { useOnboarding } from '../../features/onboarding/hooks/useOnboarding';
import { colors } from '../../util/colors';

function tabFromPath(pathname: string): HomeTab {
  if (pathname === '/profile') return 'profile';
  const section = pathname.split('/')[2];
  if (pathname.startsWith('/section/') && tabOrder.includes(section as HomeTab)) return section as HomeTab;
  return 'today';
}

export default function MainLayout() {
  const pathname = usePathname();
  const { language } = useOnboarding();
  const fontReady = useFontReady();
  const selected = tabFromPath(pathname);

  const onSelect = (tab: HomeTab) => {
    if (tab === selected) return;
    const tabDirection = tabOrder.indexOf(tab) > tabOrder.indexOf(selected) ? 'right' : 'left';
    if (tab === 'today') router.replace({ pathname: '/home', params: { tabDirection } });
    else if (tab === 'profile') router.replace({ pathname: '/profile', params: { tabDirection } });
    else router.replace({ pathname: '/section/[name]', params: { name: tab, tabDirection } });
  };

  if (!fontReady) return <View style={styles.root} />;

  return <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
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
    <BottomNavigation language={language} selected={selected} onSelect={onSelect} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  content: { flex: 1, backgroundColor: colors.homeBackground },
});
