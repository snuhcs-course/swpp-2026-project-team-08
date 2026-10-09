// This Code is generated with AI

export function ingredientId(foodId: string, name: string, occurrence = 0): string {
  const base = `${foodId}:${encodeURIComponent(name.trim().toLocaleLowerCase())}`;
  return occurrence ? `${base}:${occurrence}` : base;
}
