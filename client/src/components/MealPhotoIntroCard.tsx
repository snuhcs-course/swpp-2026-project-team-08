// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Share the compact meal photo introduction card

import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';

export function MealPhotoIntroCard({ title, subtitle }: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.navy, borderRadius: 20, padding: 16, gap: 5 },
  title: {
    color: colors.homeBorder,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: { color: colors.surface, fontFamily: fonts.poppinsRegular, fontSize: 11 },
});
