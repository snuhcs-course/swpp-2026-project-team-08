// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 조리법 고정 ID·기존 입력 호환 및 표시 이름 변환

import type { CookingMethod } from '../types/recordValues';

export const cookingMethodIds = [
  'raw', 'boiled', 'steamed', 'pan_fried', 'stir_fried',
  'baked_roasted', 'mashed_blended', 'other',
] as const satisfies readonly CookingMethod[];

const legacyCookingMethods: Record<string, CookingMethod> = {
  raw: 'raw', boiled: 'boiled', steamed: 'steamed', pan_fried: 'pan_fried',
  stir_fried: 'stir_fried', baked_roasted: 'baked_roasted', mashed_blended: 'mashed_blended', other: 'other',
  'Raw/unheated': 'raw', 'Stir-fried': 'stir_fried',
  'Baked/roasted': 'baked_roasted', 'Mashed/blended': 'mashed_blended',
  '생식·비가열': 'raw', '볶기': 'stir_fried',
  '오븐에 굽기·로스팅': 'baked_roasted', '으깨기·갈기': 'mashed_blended',
  Steamed: 'steamed', Boiled: 'boiled', 'Pan-fried': 'pan_fried', Baked: 'baked_roasted',
  Roasted: 'baked_roasted', Grilled: 'other', Raw: 'raw', Other: 'other',
  '찜': 'steamed', '삶기': 'boiled', '팬에 굽기': 'pan_fried', '오븐에 굽기': 'baked_roasted',
  '로스팅': 'baked_roasted', '직화 구이': 'other', '생식': 'raw', '기타': 'other',
};


export function normalizeCookingMethod(value: string): CookingMethod | null {
  if (!value) return null;
  return Object.hasOwn(legacyCookingMethods, value) ? legacyCookingMethods[value] : null;
}

export function cookingMethodLabel(value: string, labels: readonly string[]): string {
  const method = normalizeCookingMethod(value);
  return method ? labels[cookingMethodIds.indexOf(method)] ?? value : value;
}
