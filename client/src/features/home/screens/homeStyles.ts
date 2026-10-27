// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선

import { StyleSheet } from 'react-native';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
export const homeStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  scroll: { paddingBottom: 24 },
  greeting: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20, gap: 10, flexDirection: 'row', alignItems: 'center' },
  greetingCopy: { flex: 1, minWidth: 0, gap: 4 },
  date: { color: colors.homePrimary, fontFamily: fonts.poppinsBold, fontSize: 10, lineHeight: 15 },
  greetingTitle: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 23, lineHeight: 28.75 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.calendarEmpty, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.poppinsBold, fontSize: 14, color: colors.homeText },
  content: { paddingHorizontal: 24, gap: 18 },
  hero: { padding: 20, gap: 14, borderRadius: 22, backgroundColor: colors.navy, overflow: 'hidden', shadowColor: colors.homeShadow, shadowOffset: { width: 0, height: 10 }, shadowRadius: 26, shadowOpacity: 0.09, elevation: 3 },
  glow: { position: 'absolute', width: 104, height: 104, right: -16, top: -12, borderRadius: 52, backgroundColor: colors.homeSelected, opacity: 0.14 },
  eyebrow: { color: colors.homeSelected, fontFamily: fonts.poppinsBold, fontSize: 10, lineHeight: 15 },
  invitation: { gap: 5 },
  heroTitle: { color: colors.surface, fontFamily: fonts.poppinsSemiBold, fontSize: 17, lineHeight: 25.5 },
  heroBody: { color: colors.homeSelected, fontFamily: fonts.poppinsRegular, fontSize: 12, lineHeight: 18 },
  mealAction: { minHeight: 46, height: 46, borderRadius: 14, paddingHorizontal: 0, alignSelf: 'stretch' },
  mealActionText: { fontSize: 13, lineHeight: 19.5 },
  section: { gap: 12 },
  sectionTitle: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 16, lineHeight: 21.6 },
  reviewCard: { minHeight: 92, padding: 16, paddingBottom: 35, gap: 0, backgroundColor: colors.surface, borderRadius: 20, shadowColor: colors.homeShadow, shadowOffset: { width: 0, height: 6 }, shadowRadius: 22, shadowOpacity: 0.04, elevation: 1 },
  mealCopy: { gap: 3, paddingRight: 0 },
  mealTitle: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 16, lineHeight: 21.6 },
  mealMeta: { color: colors.homeMuted, fontFamily: fonts.poppinsRegular, fontSize: 11, lineHeight: 16.5 },
  reviewAction: { position: 'absolute', right: 22, bottom: 9, flexDirection: 'row', gap: 6, alignItems: 'center' },
  reviewStatus: { color: colors.homePrimary, fontFamily: fonts.poppinsBold, fontSize: 9, lineHeight: 13.5 },
  suggestionCard: { padding: 16, gap: 12, borderRadius: 20, backgroundColor: colors.surface, shadowColor: colors.homeShadow, shadowOffset: { width: 0, height: 6 }, shadowRadius: 22, shadowOpacity: 0.04, elevation: 1 },
  ideaRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ideaCopy: { flex: 1, minWidth: 0, gap: 3 },
  ideaTitle: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 13, lineHeight: 19.5 },
  sectionAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 5, gap: 8, minHeight: 23 },
  sectionActionText: { color: colors.homePrimary, fontFamily: fonts.poppinsSemiBold, fontSize: 12, lineHeight: 18 },
  state: { padding: 16, borderRadius: 14, backgroundColor: colors.surface, gap: 10 },
  stateText: { color: colors.homeMuted, fontSize: 12, fontFamily: fonts.poppinsRegular },
});
