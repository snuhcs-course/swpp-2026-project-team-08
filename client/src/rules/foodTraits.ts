import type { FoodTraits, TraitGroup } from '../types/meal';

export function toggleFoodTrait(traits: FoodTraits, group: TraitGroup, value: string): FoodTraits {
  const multi = group === 'texture' || group === 'tasteType' || group === 'color';
  return {
    ...traits,
    [group]: traits[group].includes(value)
      ? multi ? traits[group].filter((item) => item !== value) : []
      : multi ? [...traits[group], value] : [value],
  };
}
