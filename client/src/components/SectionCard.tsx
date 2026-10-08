import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
export function SectionCard({
  title,
  subtitle,
  accessory,
  children,
  style,
}: {
  title: string;
  subtitle: string;
  accessory?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[sectionCardStyles.card, style]}>
      <View style={sectionCardStyles.cardHeading}>
        <View style={sectionCardStyles.cardHeadingCopy}>
          <Text style={sectionCardStyles.cardTitle}>{title}</Text>
          <Text style={sectionCardStyles.cardSubtitle}>{subtitle}</Text>
        </View>
        {accessory}
      </View>
      {children}
    </View>
  );
}

export const sectionCardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: colors.navy,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 2,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 41,
  },
  cardHeadingCopy: { flex: 1, gap: 2 },
  cardTitle: {
    color: colors.homeText,
    fontSize: 16,
    fontFamily: fonts.poppinsSemiBold,
  },
  cardSubtitle: {
    color: colors.homeMuted,
    fontSize: 9,
    lineHeight: 13,
    fontFamily: fonts.poppinsRegular,
  },
});
