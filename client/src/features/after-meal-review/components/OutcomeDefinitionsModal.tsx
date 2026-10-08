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
              <Text style={[styles.badge, value === 'unanswered' && styles.warningBadge]}>
                {value === 'unanswered' ? unansweredLabel : labels[value]}
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

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', paddingHorizontal: 22 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, gap: 11 },
  title: { color: colors.homeText, fontSize: 18, fontFamily: fonts.interBold },
  intro: { color: colors.mealReviewMuted, fontSize: 10, lineHeight: 15, fontFamily: fonts.interRegular },
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  badge: { minWidth: 78, overflow: 'hidden', borderRadius: 999, backgroundColor: colors.homeSelected, color: colors.homePrimary, padding: 7, textAlign: 'center', fontSize: 8, fontFamily: fonts.interBold },
  warningBadge: { backgroundColor: colors.safetySurface, color: colors.error },
  description: { flex: 1, color: colors.homeText, fontSize: 9, lineHeight: 13, fontFamily: fonts.interRegular },
  button: { marginTop: 10, alignSelf: 'center', backgroundColor: colors.navy, paddingHorizontal: 30, paddingVertical: 11, borderRadius: 999 },
  buttonText: { color: colors.surface, fontSize: 11, fontFamily: fonts.interBold },
});
