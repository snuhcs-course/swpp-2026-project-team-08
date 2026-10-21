import type { MealDetail } from '../../types/mealRecord';
import { toMealDetail } from '../dto/mealDto';
import { apiRequest } from '../network/apiClient';

export async function listMealDetails(signal?: AbortSignal): Promise<MealDetail[]> {
  const response = await apiRequest<unknown>('/api/v1/meals', { signal });
  if (!Array.isArray(response)) throw new Error('Invalid meal list');
  return response.map(toMealDetail);
}
