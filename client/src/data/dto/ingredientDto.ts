import type { Ingredient, IngredientDraft } from '../../types/ingredientRecord';
import { id, nullable, object, text } from './values';

export type IngredientDto = { id: string; name: string };
export type IngredientInputDto = { id: string | null; name: string };

export function toIngredient(value: unknown): Ingredient {
  const dto = object(value);
  return { id: id(dto.id), name: text(dto.name) };
}

export function toIngredientInput(draft: IngredientDraft): IngredientInputDto {
  const name = text(draft.name).trim();
  if (!name) throw new Error('Ingredient name is required');
  return { id: nullable(draft.id, text), name };
}
