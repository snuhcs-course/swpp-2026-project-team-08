// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

export const mealLogKeys = {
  all: (childId: string) => ['meal-log', childId] as const,
  list: (childId: string, date: string | null) => ['meal-log', childId, 'list', date] as const,
  calendar: (childId: string, month: string) => ['meal-log', childId, 'calendar', month] as const,
  detail: (childId: string, mealId: string) => ['meal-log', childId, 'detail', mealId] as const,
};
export const mealKeys = {
  draft: (childId: string) => ['meal-draft', childId] as const,
  detail: (childId: string, id: string) => ['meal', childId, id] as const,
};
