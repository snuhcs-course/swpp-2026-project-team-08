// This Code is generated with AI

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Language } from '../types/profile';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { copyFor } from '../util/strings';

export type HomeTab =
  'today' | 'mealLog' | 'sos' | 'ideas' | 'insight' | 'profile';
export const tabOrder: HomeTab[] = [
  'today',
  'mealLog',
  'sos',
  'ideas',
  'insight',
  'profile',
];
const tabs: {
  key: HomeTab;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: 'today', icon: 'home-outline' },
  { key: 'mealLog', icon: 'silverware-fork-knife' },
  { key: 'sos', icon: 'alert-outline' },
  { key: 'ideas', icon: 'creation-outline' },
  { key: 'insight', icon: 'chart-bar' },
  { key: 'profile', icon: 'account-outline' },
];

export function BottomNavigation({
  language,
  selected,
  onSelect,
}: {
  language: Language;
  selected: HomeTab;
  onSelect: (tab: HomeTab) => void;
}) {
  const s = copyFor(language);
  return (
    <View style={styles.bar}>
      {tabs.map(({ key, icon }) => (
        <Pressable
          key={key}
          accessibilityRole="tab"
          accessibilityState={{ selected: key === selected }}
          accessibilityLabel={s.home[key]}
          onPress={() => onSelect(key)}
          style={styles.tab}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={key === selected ? colors.homePrimary : colors.homeSubtitle}
          />
          <Text
            numberOfLines={1}
            style={[styles.label, key === selected && styles.active]}
          >
            {s.home[key]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 72,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.homeBorder,
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 12,
  },
  tab: {
    width: '16.666%',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    width: '100%',
    color: colors.homeSubtitle,
    fontSize: 9,
    fontFamily: fonts.poppinsRegular,
    textAlign: 'center',
  },
  active: { color: colors.homePrimary, fontFamily: fonts.poppinsSemiBold },
});
