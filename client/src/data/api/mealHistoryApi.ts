import { apiRequest } from '../network/apiClient';

export async function deleteMealRecord(mealId: string): Promise<void> {
  await apiRequest<void>(`/api/v1/meals/${encodeURIComponent(mealId)}`, { method: 'DELETE' });
}
