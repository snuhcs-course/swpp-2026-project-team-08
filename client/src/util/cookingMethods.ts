// AI-generated with GPT-6, 2026-11-18, reviewed by Haechan Jung
// Changed: 조리법 열 가지 ID와 기존 개별 입력 표시 변환

import type { CookingMethod } from '../types/recordValues';

export const cookingMethodIds = [
  'raw', 'boiled', 'steamed', 'pan_fried', 'stir_fried',
  'baked', 'roasted', 'mashed', 'blended', 'other',
] as const satisfies readonly CookingMethod[];

const legacyCookingMethods: Record<string, CookingMethod> = {
  raw: 'raw', boiled: 'boiled', steamed: 'steamed', pan_fried: 'pan_fried',
  stir_fried: 'stir_fried', baked: 'baked', roasted: 'roasted',
  mashed: 'mashed', blended: 'blended', other: 'other',
  'Raw/unheated': 'raw', 'Stir-fried': 'stir_fried',
  '생식·비가열': 'raw', '볶기': 'stir_fried',
  Steamed: 'steamed', Boiled: 'boiled', 'Pan-fried': 'pan_fried', Baked: 'baked',
  Roasted: 'roasted', Mashed: 'mashed', Blended: 'blended',
  Grilled: 'other', Raw: 'raw', Other: 'other',
  '찜': 'steamed', '삶기': 'boiled', '팬에 굽기': 'pan_fried', '오븐에 굽기': 'baked',
  '로스팅': 'roasted', '으깨기': 'mashed', '갈기': 'blended',
  '직화 구이': 'other', '생식': 'raw', '기타': 'other',
};


export function normalizeCookingMethod(value: string): CookingMethod | null {
  if (!value) return null;
  return Object.hasOwn(legacyCookingMethods, value) ? legacyCookingMethods[value] : null;
}

export function cookingMethodLabel(value: string, labels: readonly string[]): string {
  const method = normalizeCookingMethod(value);
  return method ? labels[cookingMethodIds.indexOf(method)] ?? value : value;
}
