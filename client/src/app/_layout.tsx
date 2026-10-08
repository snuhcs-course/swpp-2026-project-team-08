import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { StyleSheet, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FontReadyContext } from '../components/FontReadyContext';
import { colors } from '../util/colors';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_700Bold, Inter_800ExtraBold,
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
  });
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <FontReadyContext.Provider value={fontsLoaded || !!fontError}>
          <View style={styles.root}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.onboardingBackground } }} />
            {!fontsLoaded && !fontError && <View style={styles.fontGate} />}
          </View>
        </FontReadyContext.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onboardingBackground },
  fontGate: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.onboardingBackground },
});
