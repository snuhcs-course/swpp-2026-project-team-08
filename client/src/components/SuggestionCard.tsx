import { useMemo } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

export function SuggestionCard({ badge, title, description, servingTip, labels, onTried, onNotTried, disabled = false }: {
  badge: string;
  title: string;
  description: string;
  servingTip?: string;
  labels: { whatToTry: string; whyEasier: string; servingTip: string; noServingTip: string; tried: string; notTried: string };
  onTried?: () => void;
  onNotTried?: () => void;
  disabled?: boolean;
}) {
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => !disabled && Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderRelease: (_event, gesture) => {
      if (disabled) return;
      if (gesture.dx > 75) onTried?.();
      if (gesture.dx < -75) onNotTried?.();
    },
  }), [disabled, onTried, onNotTried]);
  return (
    <View style={styles.root}>
      <View style={styles.backCard} />
      <View style={styles.card} {...swipe.panHandlers}>
        <Text style={styles.badge}>{badge}</Text>
        <Text style={styles.eyebrow}>{labels.whatToTry}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.eyebrow}>{labels.whyEasier}</Text>
        <Text style={styles.body}>{description}</Text>
        <Text style={styles.eyebrow}>{labels.servingTip}</Text>
        <Text style={styles.body}>{servingTip || labels.noServingTip}</Text>
        {(onTried || onNotTried) && (
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={labels.notTried} disabled={disabled} onPress={onNotTried} style={styles.noButton}>
              <Text style={styles.noText}>×</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={labels.tried} disabled={disabled} onPress={onTried} style={styles.yesButton}>
              <Text style={styles.yesText}>✓</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginVertical: 16, paddingBottom: 14 },
  backCard: { position: 'absolute', top: 13, left: 11, right: 11, bottom: 0, borderWidth: 1, borderColor: colors.mealReviewBorder, borderRadius: 17, backgroundColor: colors.homeSelected },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.mealReviewBorder, borderRadius: 17, padding: 18, gap: 8, minHeight: 245 },
  badge: { color: colors.homePrimary, fontFamily: fonts.interBold, fontSize: 8 },
  eyebrow: { color: colors.homeText, fontFamily: fonts.interBold, fontSize: 8, marginTop: 4 },
  title: { color: colors.homeText, fontFamily: fonts.poppinsBold, fontSize: 20, lineHeight: 25 },
  body: { color: colors.mealReviewMuted, fontFamily: fonts.interRegular, fontSize: 11, lineHeight: 16 },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 22 },
  noButton: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderColor: colors.mealReviewBorder, borderWidth: 1, backgroundColor: colors.surface },
  yesButton: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.homePrimary },
  noText: { color: colors.error, fontSize: 21 },
  yesText: { color: colors.surface, fontSize: 19 },
});
