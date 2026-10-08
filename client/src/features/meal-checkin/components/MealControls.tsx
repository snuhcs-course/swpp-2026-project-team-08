import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../util/colors';
import { fonts } from '../../../util/fonts';
export const mealIcons = {
  back: require('../../../../assets/meal/back.svg'),
  down: require('../../../../assets/meal/down.svg'),
  breakfast: require('../../../../assets/meal/breakfast.svg'),
  lunch: require('../../../../assets/meal/lunch.svg'),
  dinner: require('../../../../assets/meal/dinner.svg'),
  snack: require('../../../../assets/meal/snack.svg'),
  home: require('../../../../assets/meal/home.svg'),
  restaurant: require('../../../../assets/meal/restaurant.svg'),
  school: require('../../../../assets/meal/school.svg'),
  camera: require('../../../../assets/meal/camera.svg'),
  gallery: require('../../../../assets/meal/gallery.svg'),
  files: require('../../../../assets/meal/files.svg'),
  next: require('../../../../assets/meal/next.svg'),
};
export function MealIcon({
  name,
  size = 20,
}: {
  name: keyof typeof mealIcons | 'others';
  size?: number;
}) {
  return name === 'others' ? (
    <Feather name="more-horizontal" size={size} color={colors.homeText} />
  ) : (
    <Image
      source={mealIcons[name]}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
export function MealChoice({
  label,
  selected,
  onPress,
  icon,
  tile = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: keyof typeof mealIcons | 'others';
  tile?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, tile && styles.tile, selected && styles.selected]}
    >
      {icon && (
        <View style={styles.icon}>
          <MealIcon name={icon} size={21} />
        </View>
      )}
      <Text style={[styles.text, styles.choiceText]}>{label}</Text>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.dot} />}
      </View>
    </Pressable>
  );
}
export function MealSheet({
  title,
  children,
  onClose,
  closeLabel,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.scrim}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={styles.dismiss}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
        />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.handle} />
          <View style={styles.row}>
            <Text
              accessibilityRole="header"
              style={[styles.heading, { flex: 1 }]}
            >
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              onPress={onClose}
              style={styles.close}
            >
              <Feather name="x" size={20} color={colors.homeText} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export const styles = StyleSheet.create({
  text: {
    color: colors.homeText,
    fontSize: 11,
    fontFamily: fonts.poppinsRegular,
    lineHeight: 17,
  },
  muted: {
    color: colors.homeMuted,
    fontSize: 10,
    fontFamily: fonts.poppinsRegular,
    lineHeight: 16,
  },
  heading: {
    color: colors.homeText,
    fontSize: 17,
    fontFamily: fonts.poppinsSemiBold,
  },
  title: {
    color: colors.homeText,
    fontSize: 24,
    fontFamily: fonts.poppinsSemiBold,
    lineHeight: 31,
  },
  label: {
    color: colors.homeText,
    fontSize: 10,
    fontFamily: fonts.poppinsSemiBold,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stack: { gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.homeBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  info: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.infoSurface,
    gap: 8,
  },
  error: {
    color: colors.error,
    fontFamily: fonts.poppinsRegular,
    fontSize: 11,
    lineHeight: 18,
  },
  link: {
    color: colors.homePrimary,
    fontFamily: fonts.poppinsSemiBold,
    fontSize: 11,
  },
  choice: {
    minHeight: 46,
    backgroundColor: colors.surface,
    borderColor: colors.homeBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    minHeight: 76,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  choiceText: { flex: 1, fontSize: 12, fontFamily: fonts.poppinsSemiBold },
  selected: {
    borderColor: colors.homePrimary,
    backgroundColor: colors.homeSelected,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.homeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.homePrimary },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.homePrimary,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.homeSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.homeSelected,
  },
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  dismiss: { flex: 1 },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 9,
  },
  sheetContent: { paddingVertical: 16, gap: 12 },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.homeBorder,
    alignSelf: 'center',
    marginBottom: 12,
  },
  close: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.homeBackground,
  },
});
