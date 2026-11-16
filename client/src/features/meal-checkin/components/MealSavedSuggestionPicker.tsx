// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 음식에 저장 추천을 고르는 대화상자

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../components/AppButton';
import { Dialog } from '../../../components/Dialog';
import { displayDate } from '../../../util/date';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
import { abcCopyFor, copyFor } from '../../../util/strings';
import type { Language } from '../../../types/profile';
import type { MealSuggestionOption } from '../types';

export function MealSavedSuggestionPicker({
  language, suggestions, selectedId, onSelect, onLink, onClose,
}: {
  language: Language;
  suggestions: MealSuggestionOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onLink: () => void;
  onClose: () => void;
}) {
  const s = copyFor(language);
  const m = s.mealCheckin;
  const a = abcCopyFor(language);
  const sourceMeal = (item: MealSuggestionOption) => item.mealDate
    ? `${displayDate(item.mealDate, language, true)}${item.mealType && item.mealType in m.types ? ` · ${m.types[item.mealType as keyof typeof m.types]}` : ''}`
    : null;
  return (
    <Dialog title={m.savedSuggestionsTitle} closeLabel={s.common.close} onClose={onClose} footer={
      <View style={styles.actions}>
        <AppButton variant="meal" secondary label={s.common.back} onPress={onClose} style={styles.button} labelStyle={styles.buttonText} />
        <AppButton variant="meal" label={a.link} disabled={!selectedId} onPress={onLink} style={styles.button} labelStyle={styles.buttonText} />
      </View>
    }>
      <Text style={styles.intro}>{m.chooseTriedSuggestion}</Text>
      <Text style={styles.count}>{m.savedSuggestionCount(suggestions.length)}</Text>
      {suggestions.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="radio"
          accessibilityState={{ checked: item.id === selectedId }}
          onPress={() => onSelect(item.id)}
          style={[styles.card, item.id === selectedId && styles.selected]}
        >
          <View style={styles.heading}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={[styles.radio, item.id === selectedId && styles.radioOn]}>
              {item.id === selectedId ? <View style={styles.radioDot} /> : null}
            </View>
          </View>
          {!!item.description && <Text style={styles.body}>{item.description}</Text>}
          {sourceMeal(item) ? <Text style={styles.meta}>{sourceMeal(item)}</Text> : null}
        </Pressable>
      ))}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.homeMuted, fontSize: 13, fontFamily: fonts.poppinsRegular, lineHeight: 18 },
  count: { color: colors.homeMuted, fontSize: 12, fontFamily: fonts.poppinsMedium },
  actions: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, minHeight: 44, height: 44, borderRadius: 10 },
  buttonText: { fontSize: 13, fontFamily: fonts.poppinsSemiBold },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.homeBorder,
    borderRadius: 18,
    padding: 15,
    gap: 8,
  },
  selected: { borderColor: colors.homePrimary, backgroundColor: colors.homeSelected },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, color: colors.homeText, fontSize: 16, fontFamily: fonts.poppinsSemiBold, lineHeight: 24 },
  body: { color: colors.homeText, fontSize: 14, fontFamily: fonts.poppinsRegular, lineHeight: 20 },
  meta: { color: colors.mealReviewMuted, fontSize: 13, fontFamily: fonts.poppinsMedium },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.mealReviewBorder, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderWidth: 2, borderColor: colors.homePrimary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.homePrimary },
});
