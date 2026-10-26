// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Haechan Jung
// Changed: 클라이언트 모델, DTO, DB Schema 통합 및 일관화

import { AppHeader, topBarStyles } from '../../../components/AppHeader';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../../components/AppButton';
import type { MealDraft } from '../../../types/meal';
import type { Language } from '../../../types/profile';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { displayDate } from '../../../util/date';
import { copyFor } from '../../../util/strings';

export function MealDraftResumeView({ draft, childName, language, onContinue, onBack }: {
  draft: MealDraft; childName: string; language: Language; onContinue: () => void; onBack: () => void;
}) {
  const s = copyFor(language);
  const m = s.mealCheckin;
  return <SafeAreaView style={styles.root}>
    <AppHeader title={m.ongoingHeader} backLabel={s.common.back} onBack={onBack} />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>{m.childMeals(childName)}</Text>
      <Text style={styles.title}>{m.ongoingTitle}</Text>
      <Text style={styles.intro}>{m.ongoingIntro}</Text>
      <View style={styles.card}>
        <Text style={styles.badge}>{m.autoSavedDraft}</Text>
        <Text style={styles.meal}>{childName}{draft.mealType ? ` · ${m.types[draft.mealType]}` : ''}</Text>
        <Text style={styles.date}>{displayDate(draft.mealDate, language)}</Text>
        <Text style={styles.summary}>{draft.photo ? m.draftPhotoSaved : m.draftNoPhoto} · {m.draftFoodCount(draft.foods.length)}</Text>
        <AppButton secondary variant="meal" label={m.continueDraft} onPress={onContinue} style={styles.continue} labelStyle={styles.continueLabel} />
      </View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.afterMealBackground },
  subtitle: { color: colors.mealReviewMuted, fontFamily: fonts.poppinsRegular, fontSize: 10, lineHeight: 15 },
  content: { ...topBarStyles.content, paddingBottom: 16, gap: 16 },
  title: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 22, lineHeight: 31.9 },
  intro: { color: colors.homeText, fontFamily: fonts.poppinsRegular, fontSize: 12, lineHeight: 17.4 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.mealReviewBorder, borderRadius: 14, padding: 12, gap: 6 },
  badge: { color: colors.homePrimary, fontFamily: fonts.poppinsSemiBold, fontSize: 9, lineHeight: 13.5 },
  meal: { color: colors.homeText, fontFamily: fonts.poppinsSemiBold, fontSize: 15, lineHeight: 22.5 },
  date: { color: colors.mealReviewMuted, fontFamily: fonts.poppinsRegular, fontSize: 11, lineHeight: 15.95 },
  summary: { color: colors.homeText, fontFamily: fonts.poppinsRegular, fontSize: 11, lineHeight: 15.95 },
  continue: { height: 50, minHeight: 50, padding: 12, borderRadius: 14, borderColor: colors.mealReviewBorder },
  continueLabel: { color: colors.homePrimary, fontFamily: fonts.poppinsSemiBold, fontSize: 13, lineHeight: 18.2 },
});
