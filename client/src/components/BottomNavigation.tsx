// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; match home navigation original Figma assets
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { HomeAssetIcon } from './HomeAssetIcon';
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
  { key: 'ideas', icon: 'bookmark-outline' },
  { key: 'insight', icon: 'chart-bar' },
  { key: 'profile', icon: 'account-outline' },
];

export function BottomNavigation({
  language,
  selected,
  onSelect,
  homeAppearance = false,
  compactHome = false,
}: {
  homeAppearance?: boolean;
  compactHome?: boolean;
  language: Language;
  selected: HomeTab;
  onSelect: (tab: HomeTab) => void;
}) {
  const s = copyFor(language);
  return (
    <View style={[styles.bar, homeAppearance && styles.homeBar]}>
      {tabs.filter(tab => !compactHome || !['sos', 'insight'].includes(tab.key)).map(({ key, icon }) => (
        <Pressable
          key={key}
          accessibilityRole="tab"
          accessibilityState={{ selected: key === selected }}
          accessibilityLabel={homeAppearance && key === 'ideas' ? s.home.ideasTab : s.home[key]}
          onPress={() => onSelect(key)}
          style={[styles.tab, homeAppearance && styles.homeTab, compactHome && { width: '25%' }]}
        >
          {homeAppearance ? <View style={[styles.homeIcon, key === 'mealLog' && { alignItems: 'flex-end', justifyContent: 'flex-start' }, key === 'profile' && { justifyContent: 'flex-start' }]}><HomeAssetIcon name={key} /></View> : <MaterialCommunityIcons name={icon} size={20} color={key === selected ? colors.homePrimary : colors.homeSubtitle} />}
          <Text
            numberOfLines={1}
            style={[styles.label, homeAppearance && styles.homeLabel, key === selected && styles.active]}
          >
            {homeAppearance && key === 'ideas' ? s.home.ideasTab : s.home[key]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  homeBar: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, borderTopColor: colors.homeNavBorder },
  homeIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  homeLabel: { color: colors.homeMuted, fontFamily: fonts.poppinsMedium },
  homeTab: { gap: 5, justifyContent: 'flex-start' },
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
