// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: Remove Insight tab and share navigation height including the bottom safe area

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Language } from '../types/profile';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { copyFor } from '../util/strings';

export type HomeTab =
  'today' | 'mealLog' | 'ideas' | 'profile';
export const tabOrder: HomeTab[] = [
  'today',
  'mealLog',
  'ideas',
  'profile',
];

export function bottomNavigationHeight(bottomInset: number) {
  return 60 + Math.max(12, bottomInset);
}
const tabs: {
  key: HomeTab;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: 'today', icon: 'home-outline' },
  { key: 'mealLog', icon: 'silverware-fork-knife' },
  { key: 'ideas', icon: 'bookmark-outline' },
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
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(12, insets.bottom);
  return (
    <View style={[styles.bar, { height: bottomNavigationHeight(insets.bottom), paddingBottom }]}>
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
            size={28}
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.homeBorder,
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    width: '100%',
    color: colors.homeSubtitle,
    fontSize: 11,
    fontFamily: fonts.poppinsRegular,
    textAlign: 'center',
  },
  active: { color: colors.homePrimary, fontFamily: fonts.poppinsSemiBold },
});
