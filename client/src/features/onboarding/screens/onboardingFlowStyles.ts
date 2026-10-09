import { StyleSheet } from 'react-native';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onboardingBackground },
  flex: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 3, paddingBottom: 0 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  progressText: { color: colors.onboardingPrimary, fontSize: 9, fontFamily: fonts.interExtraBold },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  saveText: { color: colors.success, fontSize: 8, fontFamily: fonts.interBold, flexShrink: 1 },
  saveError: { color: colors.error },
  track: { height: 3, borderRadius: 999, backgroundColor: colors.progressTrack, marginTop: 6, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 999, backgroundColor: colors.onboardingPrimary },
  title: { color: colors.onboardingText, fontSize: 20, fontFamily: fonts.interBold, marginTop: 5, lineHeight: 22 },
  sensoryTitle: { color: colors.onboardingText, fontSize: 16, fontFamily: fonts.interBold, marginTop: 5, lineHeight: 17 },
  subtitle: { color: colors.onboardingMuted, fontSize: 10, fontFamily: fonts.interRegular, lineHeight: 14, marginTop: 2 },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 30 },
  saveExit: { marginTop: 16 },
  retry: { marginTop: 10 },
  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 5, minHeight: 77, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.onboardingBorder, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  previous: { width: 96 },
  next: { flex: 1 },
});
