import { StyleSheet, Text, View } from 'react-native';
import type { FoodTraits } from '../types/meal';
import { formStyles as styles } from './formStyles';
import { colors } from '../util/colors';
import { fonts } from '../util/fonts';
import { UiAssetIcon, type UiAssetIconName } from './UiAssetIcon';

const traitIcons: Record<keyof FoodTraits, UiAssetIconName> = {
  texture: 'trait-leaf', tasteType: 'trait-droplet', tasteIntensity: 'trait-sparkles',
  smell: 'trait-wind', color: 'trait-square', shape: 'trait-check-circle',
  visibility: 'trait-eye', temperature: 'trait-sun',
};
export function FoodTraitsTags({
  traits,
  labels,
}: {
  traits: FoodTraits;
  labels: { trait: (value: string) => string; empty: string };
}) {
  const tags = Object.entries(traits).flatMap(([group, values]) =>
    values.map((value) => ({
      key: `${group}-${value}`,
      label: labels.trait(value),
      icon: traitIcons[group as keyof FoodTraits],
      positive: group === 'color' || group === 'tasteIntensity',
    })),
  );
  return (
    <View style={styles.grid}>
      {tags.length ? (
        tags.map((tag) => (
          <View key={tag.key} style={[tagStyles.tag, tag.positive && tagStyles.positiveTag]}>
            <UiAssetIcon name={tag.icon} />
            <Text style={[tagStyles.text, tag.positive && tagStyles.positiveText]}>{tag.label}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>{labels.empty}</Text>
      )}
    </View>
  );
}

const tagStyles = StyleSheet.create({
  tag: { borderRadius: 999, backgroundColor: colors.suggestionSurface, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  positiveTag: { backgroundColor: colors.successSurface },
  text: { color: colors.suggestionText, fontSize: 10, fontFamily: fonts.poppinsRegular },
  positiveText: { color: colors.success },
});
