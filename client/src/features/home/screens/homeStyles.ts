// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-19, reviewed by Haechan Jung
// Changed: 홈 식사 이동 카드를 공통 컴포넌트로 분리
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 홈 식사 기록·추천 버튼의 배치와 색상 적용

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
  quickActions: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, minWidth: 0, minHeight: 142, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 16 },
  logCard: { backgroundColor: colors.navy },
  getSuggestionCard: { backgroundColor: colors.homePrimary },
  actionTitle: { marginTop: 12, color: colors.surface, fontFamily: fonts.poppinsSemiBold, fontSize: 15, lineHeight: 22 },
  actionBody: { marginTop: 5, color: colors.homeSelected, fontFamily: fonts.poppinsRegular, fontSize: 11.5, lineHeight: 17 },
  section: { gap: 12 },
  sectionTitle: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 16, lineHeight: 21.6 },
  mealMeta: { color: colors.homeMuted, fontFamily: fonts.poppinsRegular, fontSize: 11, lineHeight: 16.5 },
  suggestionCard: { padding: 16, gap: 12, borderRadius: 20, backgroundColor: colors.surface, shadowColor: colors.homeShadow, shadowOffset: { width: 0, height: 6 }, shadowRadius: 22, shadowOpacity: 0.04, elevation: 1 },
  ideaRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ideaCopy: { flex: 1, minWidth: 0, gap: 3 },
  ideaTitle: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 13, lineHeight: 19.5 },
  sectionAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 5, gap: 8, minHeight: 23 },
  sectionActionText: { color: colors.homePrimary, fontFamily: fonts.poppinsSemiBold, fontSize: 12, lineHeight: 18 },
  state: { padding: 16, borderRadius: 14, backgroundColor: colors.surface, gap: 10 },
  stateText: { color: colors.homeMuted, fontSize: 12, fontFamily: fonts.poppinsRegular },
});
