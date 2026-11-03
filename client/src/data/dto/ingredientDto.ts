// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 재료 입력에서 id 제거(서버가 이름만 받음)

import type { Ingredient, IngredientDraft } from '../../types/ingredientRecord';
import { id, object, text } from './values';

export type IngredientDto = { id: string; name: string };
export type IngredientInputDto = { name: string };

export function toIngredient(value: unknown): Ingredient {
  const dto = object(value);
  return { id: id(dto.id), name: text(dto.name) };
}

export function toIngredientInput(draft: IngredientDraft): IngredientInputDto {
  const name = text(draft.name).trim();
  if (!name) throw new Error('Ingredient name is required');
  return { name };
}
