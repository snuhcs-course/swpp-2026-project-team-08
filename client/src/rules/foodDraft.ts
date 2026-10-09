// This Code is generated with AI

import type { FoodItem, FoodTraits } from '../types/meal';

export const emptyTraits = (): FoodTraits => ({
  texture: [], tasteType: [], tasteIntensity: [], smell: [],
  shape: [], visibility: [], temperature: [], color: [],
});

export function newFood(): FoodItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '', ingredients: [], preparation: '', servingNote: '',
    traits: emptyTraits(), history: null, source: 'parent',
  };
}
