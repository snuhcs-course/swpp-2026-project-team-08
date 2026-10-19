// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
import type { FoodItem } from '../types/meal';

export function newFood(): FoodItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '', ingredients: [], preparation: '', servingNote: '',
    source: 'parent',
    // AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
    confirmed: false,
  };
}
