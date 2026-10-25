// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { outcomeValues, type Outcome } from '../../../types/afterMealReview';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';

export function OutcomeDefinitionsModal({ visible, title, intro, labels, descriptions, unansweredLabel, gotIt, onClose }: {
  visible: boolean;
  title: string;
  intro: string;
  labels: Record<Outcome, string>;
  descriptions: Record<Outcome | 'unanswered', string>;
  unansweredLabel: string;
  gotIt: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable accessibilityRole="button" accessibilityLabel={gotIt} onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.intro}>{intro}</Text>
          {[...outcomeValues, 'unanswered' as const].map((value) => (
            <View key={value} style={styles.row}>
              <Text style={[styles.badge, { backgroundColor: badgeColors[value][0], color: badgeColors[value][1] }]}>
                {(value === 'unanswered' ? unansweredLabel : labels[value]).toLocaleUpperCase()}
              </Text>
              <Text style={styles.description}>{descriptions[value]}</Text>
            </View>
          ))}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>{gotIt}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const badgeColors = {
  eaten: [colors.outcomeEaten, colors.outcomeEatenText], tasted: [colors.outcomeTasted, colors.outcomeTastedText],
  untouched: [colors.outcomeUntouched, colors.outcomeUntouchedText], unclear: [colors.outcomeUnclear, colors.mealReviewMuted],
  unanswered: [colors.outcomeUnanswered, colors.surface],
} as const;
const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', paddingHorizontal: 18 },
  card: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.suggestionCardBorder, padding: 16, gap: 6, minHeight: 402 },
  title: { color: colors.reviewHeading, fontSize: 18, fontFamily: fonts.poppinsBold },
  intro: { color: colors.outcomeDefinitionText, fontSize: 10, lineHeight: 15, fontFamily: fonts.poppinsRegular },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, minHeight: 44 },
  badge: {  overflow: 'hidden', borderRadius: 999, backgroundColor: colors.homeSelected, color: colors.homePrimary, paddingVertical: 5, paddingHorizontal: 9, textAlign: 'center', fontSize: 9, letterSpacing: 0.6, fontFamily: fonts.poppinsBold },
  warningBadge: { backgroundColor: colors.safetySurface, color: colors.error },
  description: { flex: 1, color: colors.outcomeDefinitionText, fontSize: 10, lineHeight: 14, fontFamily: fonts.poppinsRegular },
  button: { marginTop: 10, width: 133, height: 38, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.outcomeTastedText, borderRadius: 999 },
  buttonText: { color: colors.surface, fontSize: 12, fontFamily: fonts.poppinsSemiBold },
});
