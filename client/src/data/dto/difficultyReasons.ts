// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 난이도 사유 태그와 서버 경로 문자열(DifficultyReason) 변환 추가

import type { Difficulty, DifficultyCategory } from '../../types/reviewRecord';
import { text } from './values';

// 서버 DifficultyReason 은 `CATEGORY.VALUE` 이고 TEXTURE 만 `TEXTURE.SUBCATEGORY.VALUE` 이다.
// NOT_SURE 는 값이 없는 category 하나뿐이다.
const serverCategory: Record<DifficultyCategory, string> = {
  texture: 'TEXTURE',
  tasteType: 'TASTE',
  smell: 'SMELL',
  color: 'COLOR',
  temperature: 'TEMPERATURE',
  pieceSize: 'PIECE_SIZE',
  arrangement: 'ARRANGEMENT',
  notSure: 'NOT_SURE',
};
const appCategory = Object.fromEntries(
  Object.entries(serverCategory).map(([app, server]) => [server, app]),
) as Record<string, DifficultyCategory>;

const upperSnake = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
const lowerCamel = (value: string) => value.toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export function toDifficultyReason(difficulty: Difficulty): string {
  const category = serverCategory[difficulty.category];
  if (!category) throw new Error('Unsupported difficulty category');
  if (difficulty.category === 'notSure') return category;
  const value = upperSnake(text(difficulty.value));
  if (difficulty.category === 'texture') {
    if (!difficulty.subcategory) throw new Error('Texture difficulty needs a subcategory');
    return `${category}.${upperSnake(difficulty.subcategory)}.${value}`;
  }
  return `${category}.${value}`;
}

export function fromDifficultyReason(value: unknown): Difficulty {
  const reason = text(value);
  if (!/^[A-Z_]+(\.[A-Z_]+){0,2}$/.test(reason)) throw new Error('Invalid difficulty reason');
  const [head, ...rest] = reason.split('.');
  const category = appCategory[head];
  if (!category) throw new Error('Invalid difficulty reason');
  if (category === 'notSure') {
    if (rest.length) throw new Error('Invalid difficulty reason');
    return { category, subcategory: null, value: 'notSure' };
  }
  if (category === 'texture') {
    if (rest.length !== 2) throw new Error('Invalid difficulty reason');
    return { category, subcategory: lowerCamel(rest[0]), value: lowerCamel(rest[1]) };
  }
  if (rest.length !== 1) throw new Error('Invalid difficulty reason');
  return { category, subcategory: null, value: lowerCamel(rest[0]) };
}
