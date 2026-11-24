// AI-generated with GPT-6, 2026-11-09, reviewed by Haechan Jung
// Changed: 식후 입력과 식사 기록의 어려움 태그 표시 통일
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 어려움 태그 글자를 더 작게 하고 굵게 쓰지 않음

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, difficultyColorDots } from '../util/colors';
import { fonts } from '../util/fonts';

export function DifficultyReasonTag({ reason, labels, onRemove }: {
  reason: { category: string; value: string; subcategory?: string | null; note?: string };
  labels: {
    categories: Partial<Record<string, string>>;
    questions: Record<string, string>;
    values: Record<string, string>;
    remove: string;
  };
  onRemove?: () => void;
}) {
  const category = labels.categories[reason.category] ?? reason.category;
  const title = reason.subcategory
    ? `${category} · ${labels.questions[reason.subcategory] ?? reason.subcategory}`
    : category;
  const value = labels.values[reason.value] ?? reason.value;
  const description = reason.category === 'notSure' ? title : `${title}: ${value}`;
  const label = reason.note ? `${description} · ${reason.note}` : description;
  const content = <>
    {reason.category === 'color' && reason.value in difficultyColorDots && (
      <View style={[styles.colorDot, {
        backgroundColor: difficultyColorDots[reason.value as keyof typeof difficultyColorDots],
      }]} />
    )}
    <Text style={styles.text}>{label}{onRemove ? ' ×' : ''}</Text>
  </>;

  return onRemove ? (
    <Pressable accessibilityRole="button" accessibilityLabel={`${labels.remove}: ${label}`}
      onPress={onRemove} style={styles.tag}>{content}</Pressable>
  ) : <View style={styles.tag}>{content}</View>;
}

const styles = StyleSheet.create({
  tag: {
    maxWidth: '100%', borderRadius: 999, backgroundColor: colors.successSurface,
    paddingHorizontal: 6, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  text: { flexShrink: 1, color: colors.success, fontSize: 15, fontFamily: fonts.interRegular },
  colorDot: {
    width: 11, height: 11, borderRadius: 6, borderWidth: 1,
    borderColor: colors.mealReviewBorder, flexShrink: 0,
  },
});
