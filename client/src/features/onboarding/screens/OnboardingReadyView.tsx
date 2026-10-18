// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; aligned ABC button typography
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung

import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { abcCopyFor } from '../../../util/strings';
import type { Language } from '../../../types/profile';

export function OnboardingReadyView({ language, childName, onHome }: {
  language: Language; childName: string; onHome: () => void;
}) {
  const copy = abcCopyFor(language);
  return <SafeAreaView style={styles.root}>
    <View style={styles.content}>
      <Text style={styles.title}>{copy.ready}</Text>
      <Text style={styles.subtitle}>{copy.readyFor(childName)}</Text>
      <AppButton label={copy.next} onPress={onHome} style={styles.button} labelStyle={styles.buttonLabel} />
    </View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onboardingBackground },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  title: { color: colors.onboardingText, fontFamily: fonts.poppinsBold, fontSize: 40, lineHeight: 43.2, textAlign: 'center', width: '100%' },
  subtitle: { color: colors.onboardingText, fontFamily: fonts.poppinsSemiBold, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  buttonLabel: { fontFamily: fonts.poppinsSemiBold, fontSize: 16 },
  button: { width: 230, maxWidth: '100%' },
});
