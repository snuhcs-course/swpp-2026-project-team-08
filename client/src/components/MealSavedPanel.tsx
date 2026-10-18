// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { UiAssetIcon } from './UiAssetIcon';

export function MealSavedPanel({ title, message, badge, photos, date, foodNames, note, actions, status = 'saved' }: {
  status?: 'saved' | 'saving' | 'error';
  title: string; message: string; badge?: string; photos: string[]; date: string;
  foodNames: string; note?: string; actions: ReactNode;
}) {
  return <View style={styles.root}>
    <View style={styles.hero}>
      <View style={[styles.success, status === "saving" && { backgroundColor: colors.homeSelected }, status === "error" && { backgroundColor: colors.safetySurface }]}>{status === "saving" ? <ActivityIndicator size={28} color={colors.homePrimary} /> : <UiAssetIcon name={status === "error" ? "meal-save-error" : "meal-saved-check"} />}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
    <View style={styles.card}>
      {!!photos.length && <View style={styles.photos}>{photos.map((uri, i) => <Image key={i} source={{ uri }} contentFit="cover" style={photos.length > 1 || status !== "saved" ? styles.smallPhoto : styles.photo} />)}</View>}
      <View style={styles.details}>
        {badge && <Text style={styles.badge}>{badge}</Text>}
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.food}>{foodNames}</Text>
      </View>
    </View>
    {note && <View style={styles.note}><Text style={styles.noteText}>{note}</Text></View>}
    <View style={styles.actions}>{actions}</View>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, gap: 32, paddingTop: 24 },
  hero: { alignItems: 'center', gap: 12 },
  success: { width: 64, height: 64, borderRadius: 24, backgroundColor: colors.successSurface, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, lineHeight: 31, fontFamily: fonts.poppinsSemiBold, color: colors.homeText, textAlign: 'center' },
  message: { fontSize: 12, lineHeight: 18, fontFamily: fonts.poppinsRegular, color: colors.mealReviewMuted, textAlign: 'center' },
  card: { borderWidth: 1, borderColor: colors.mealReviewBorder, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface },
  photos: { flexDirection: 'row', gap: 5 },
  photo: { width: 95, height: 79, borderRadius: 8 },
  smallPhoto: { width: 52, height: 48, borderRadius: 8 },
  details: { flex: 1, gap: 8 },
  badge: { alignSelf: 'flex-end', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontFamily: fonts.poppinsMedium, color: colors.homePrimary, backgroundColor: colors.homeSelected },
  date: { fontSize: 14, lineHeight: 21, fontFamily: fonts.poppinsRegular, color: colors.homeText },
  food: { fontSize: 13, lineHeight: 19.5, fontFamily: fonts.poppinsSemiBold, color: colors.homeText },
  note: { marginTop: 'auto', backgroundColor: colors.homeSelected, borderRadius: 14, borderWidth: 1, borderColor: colors.mealReviewBorder, padding: 13 },
  noteText: { color: colors.homeText, fontFamily: fonts.poppinsRegular, fontSize: 11, lineHeight: 17 },
  actions: { marginTop: 'auto', gap: 8, paddingTop: 12 },
});
