import { Text, View } from 'react-native';
import type { FoodTraits } from '../types/meal';
import { formStyles as styles } from './formStyles';
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
    })),
  );
  return (
    <View style={styles.grid}>
      {tags.length ? (
        tags.map((tag) => (
          <View key={tag.key} style={styles.tag}>
            <Text style={styles.text}>{tag.label}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>{labels.empty}</Text>
      )}
    </View>
  );
}
