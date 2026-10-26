// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

import type { FoodItem } from '../types/meal';

export function newFood(): FoodItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '', ingredients: [], preparation: '', servingNote: '',
    source: 'parent',
    confirmed: false,
  };
}
