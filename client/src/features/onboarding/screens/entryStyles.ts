// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim

import { StyleSheet } from 'react-native';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onboardingBackground, paddingHorizontal: 24, paddingBottom: 25 },
  body: { flex: 1, justifyContent: 'center', gap: 14 },
  brand: { color: colors.onboardingPrimary, fontSize: 16, fontFamily: fonts.interExtraBold },
  title: { color: colors.onboardingText, fontSize: 28, fontFamily: fonts.interExtraBold },
  subtitle: { color: colors.onboardingMuted, fontSize: 14, fontFamily: fonts.interRegular, marginTop: -6 },
  error: { color: colors.error, fontSize: 13, fontFamily: fonts.interRegular },
  loading: { color: colors.onboardingMuted, marginTop: 12 },
  actions: { gap: 10 },
  linkWrap: { alignItems: 'center', paddingVertical: 12 },
  link: { color: colors.onboardingPrimary, fontSize: 13, fontFamily: fonts.interBold },
});
