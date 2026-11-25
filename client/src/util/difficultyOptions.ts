// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 식후 및 온보딩 어려움 선택지 공유
// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 사용자 지정 어려움 선택지
import type { DifficultyCategory } from '../types/afterMealReview';

export const difficultyOptions: Record<DifficultyCategory, readonly string[]> = {
  texture: ['soft', 'firm', 'hard'],
  tasteType: ['sweet', 'salty', 'sour', 'bitter', 'savory', 'other'],
  smell: ['fruit', 'herb', 'mushroom', 'toasted', 'vanilla', 'dairy', 'meaty', 'sulfur', 'sea', 'fermented', 'spice', 'mint', 'smoke', 'other'],
  color: ['red', 'yellow', 'green', 'brown', 'white', 'other'],
  temperature: ['hot', 'warm', 'cool', 'room', 'other'],
  pieceSize: ['fine', 'small', 'large', 'other'],
  arrangement: ['even', 'uneven', 'clustered', 'other'],
  notSure: ['notSure'],
  other: [],
};

const textureValues: Record<string, readonly string[]> = {
  hardness: ['soft', 'firm', 'hard'], breaking: ['crumbly', 'crunchy', 'brittle'],
  chewing: ['tender', 'chewy', 'tough'], stickiness: ['nonSticky', 'sticky', 'gummy'],
  springiness: ['springy', 'rubbery'], thickness: ['fluid', 'thin', 'thick', 'viscous'],
  moisture: ['dry', 'moist', 'juicy', 'wet'], oiliness: ['nonFatty', 'oily', 'greasy'],
  graininess: ['grainy', 'gritty', 'sandy', 'mealy', 'powdery'], density: ['dense', 'airy'],
  surface: ['smooth', 'rough', 'bumpy', 'crusty', 'fuzzy'], structure: ['fibrous', 'fleshy', 'layered', 'spongy'],
};

export const textureQuestions: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(textureValues).map(([key, values]) => [key, [...values, 'other']]),
);
