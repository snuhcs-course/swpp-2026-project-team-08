import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFontReady } from '../components/FontReadyContext';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { strings } from '../util/strings';

export default function EntryScreen() {
  const fontReady = useFontReady();
  return <SafeAreaView style={styles.root}>
    {fontReady && <View style={styles.body}>
      <Text style={styles.title}>{strings.en.common.brand}</Text>
    </View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onboardingBackground },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.onboardingText, fontSize: 24, fontFamily: fonts.interBold },
});
