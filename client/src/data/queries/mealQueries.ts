// AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
// Changed: 식사 기록·로그인 기능 추가
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateReviewMealFoods } from '../api/mealFoodsApi';
import { getMealDetail } from '../api/mealReadApi';
import { writeMeal } from '../api/mealWriteApi';
import { toLegacyMeal } from '../dto/mealLegacyDto';
import { readMealDraft, readMeals, saveMeal } from '../storage/mealStorage';
import type { FoodItem } from '../../types/meal';
import { homeKeys } from './homeQueries';
import { mealKeys, mealLogKeys } from './mealQueryKeys';
import { checkinReferenceKeys } from './checkinReferenceQueries';

export { mealKeys } from './mealQueryKeys';

export const useMealDraft = (childId: string) =>
  useQuery({
    queryKey: mealKeys.draft(childId),
    queryFn: () => readMealDraft(childId),
    enabled: !!childId,
  });
export const useMealDetail = (childId: string, id: string) =>
  useQuery({
    queryKey: mealKeys.detail(childId, id),
    queryFn: ({ signal }) => getMealDetail(id, signal),
    enabled: !!childId && !!id,
  });
export const useMeal = (childId: string, id: string) =>
  useQuery({
    queryKey: mealKeys.detail(childId, id),
    queryFn: ({ signal }) => getMealDetail(id, signal),
    select: toLegacyMeal,
    enabled: !!childId && !!id,
  });
export const useMeals = (childId: string) =>
  useQuery({
    queryKey: ['meals', childId],
    queryFn: () => readMeals(childId),
    enabled: !!childId,
  });
export function useUpdateMealFoods() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ childId, mealId, foods }: { childId: string; mealId: string; foods: FoodItem[] }) => {
      const existing = await getMealDetail(mealId);
      if (existing.userId !== childId) throw new Error('Mismatched meal owner');
      const { detail, foodIdMap } = await updateReviewMealFoods(
        mealId, foods, existing.foods.map((food) => food.id),
      );
      if (detail.userId !== childId) throw new Error('Mismatched meal owner');
      return { detail, meal: toLegacyMeal(detail), foodIdMap };
    },
    onSuccess: ({ detail }) => {
      client.setQueryData(mealKeys.detail(detail.userId, detail.id), detail);
      void client.invalidateQueries({ queryKey: ['meals', detail.userId] });
      void client.invalidateQueries({ queryKey: mealKeys.draft(detail.userId) });
      void client.invalidateQueries({ queryKey: mealLogKeys.all(detail.userId) });
      void client.invalidateQueries({ queryKey: checkinReferenceKeys.meals(detail.userId) });
    },
  });
}
export function useSaveMeal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (meal: Parameters<typeof saveMeal>[0]) => {
      const saved = await writeMeal(meal);
      await saveMeal(saved);
      return saved;
    },
    retry: false,
    onSuccess: (meal) => {
      void client.invalidateQueries({ queryKey: mealKeys.detail(meal.childId, meal.id) });
      void client.invalidateQueries({ queryKey: ['meals', meal.childId] });
      void client.invalidateQueries({
        queryKey: homeKeys.byChild(meal.childId),
      });
      void client.invalidateQueries({ queryKey: mealKeys.draft(meal.childId) });
      void client.invalidateQueries({ queryKey: mealLogKeys.all(meal.childId) });
      void client.invalidateQueries({ queryKey: checkinReferenceKeys.meals(meal.childId) });
    },
  });
}
