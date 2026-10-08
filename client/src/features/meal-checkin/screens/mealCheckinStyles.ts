import { StyleSheet } from 'react-native';
import { colors } from '../../../util/colors';
import { formStyles as ui } from '../../../components/formStyles';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.homeBackground },
  reviewRoot: { backgroundColor: colors.mealReviewBackground },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  progress: { flexDirection: 'row', gap: 6, marginHorizontal: 24 },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.homeBorder,
  },
  activeSegment: { backgroundColor: colors.homePrimary },
  content: { paddingHorizontal: 24, paddingVertical: 14, gap: 10, flexGrow: 1 },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, gap: 10 },
  photo: {
    height: 300,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.homeBorder,
  },
  hero: {
    backgroundColor: colors.navy,
    padding: 18,
    borderRadius: 20,
    gap: 10,
  },
  heroTitle: {
    ...ui.title,
    fontSize: 20,
    lineHeight: 26,
    color: colors.homeBorder,
  },
  heroText: { ...ui.text, color: colors.surface },
  example: { width: 112, height: 112, borderRadius: 18 },
});
