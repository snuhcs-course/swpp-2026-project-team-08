// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; matched onboarding Figma typography and spacing
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// This Code is generated with AI

import { StyleSheet } from 'react-native';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onboardingBackground },
  flex: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 3, paddingBottom: 9 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  progressText: { color: colors.onboardingPrimary, fontSize: 13, fontFamily: fonts.poppinsBold },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  saveText: { color: colors.success, fontSize: 13, fontFamily: fonts.poppinsBold, flexShrink: 1 },
  saveError: { color: colors.error },
  track: { height: 3, borderRadius: 999, backgroundColor: colors.progressTrack, marginTop: 6, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 999, backgroundColor: colors.onboardingPrimary },
  title: { color: colors.onboardingText, fontSize: 20, fontFamily: fonts.poppinsBold, marginTop: 16, lineHeight: 21.6 },
  sensoryTitle: { color: colors.onboardingText, fontSize: 16, fontFamily: fonts.poppinsBold, marginTop: 5, lineHeight: 17 },
  subtitle: { color: colors.onboardingMuted, fontSize: 13, fontFamily: fonts.poppinsRegular, lineHeight: 18, marginTop: 6 },
  content: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 8 },
  saveExit: { marginTop: 16 },
  retry: { marginTop: 10 },
  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 20, minHeight: 80, alignItems: 'center', backgroundColor: colors.onboardingBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  previous: { width: 96, height: 46 },
  next: { flex: 1, height: 46 },
});
