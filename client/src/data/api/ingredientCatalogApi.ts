import type { Ingredient } from '../../types/ingredientRecord';
import { toIngredient } from '../dto/ingredientDto';
import { apiRequest } from '../network/apiClient';

export async function listIngredientCatalog(signal?: AbortSignal): Promise<Ingredient[]> {
  const response = await apiRequest<unknown>('/api/v1/ingredients', { signal });
  if (!Array.isArray(response)) throw new Error('Invalid ingredient catalog');
  return response.map(toIngredient);
}
