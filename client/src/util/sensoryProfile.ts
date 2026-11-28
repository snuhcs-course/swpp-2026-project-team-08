// AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
// Changed: 감각 프로필 요약
import type { Language } from '../types/profile';
import { abcCopyFor, copyFor } from './strings';

export function sensoryProfileSummary(textures: readonly string[] | undefined, note: string | undefined, language: Language): string {
  const labels = abcCopyFor(language);
  const categories: Record<string, string> = labels.subcategories;
  const values: Record<string, string> = labels.values;
  const entries = (textures ?? []).map(item => {
    const [category, value] = item.split('.');
    return value ? `${categories[category] ?? category}: ${values[value] ?? value}` : item;
  });
  if (note?.trim()) entries.push(note.trim());
  return entries.length ? entries.join('\n') : copyFor(language).common.notEntered;
}
