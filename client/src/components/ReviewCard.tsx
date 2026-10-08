import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
export function ReviewCard({
  title,
  value,
  onEdit,
  editLabel,
}: {
  title: string;
  value: string;
  onEdit: () => void;
  editLabel: string;
}) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewTitle}>{title}</Text>
        <Pressable onPress={onEdit} accessibilityRole="button">
          <Text style={styles.edit}>{editLabel}</Text>
        </Pressable>
      </View>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.onboardingBorder,
    padding: 13,
    marginBottom: 9,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  reviewTitle: {
    color: colors.onboardingText,
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  reviewValue: {
    color: colors.onboardingMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  edit: { color: colors.onboardingPrimary, fontSize: 12, fontWeight: '800' },
});
