// This Code is generated with AI

import AsyncStorage from '@react-native-async-storage/async-storage';
import { difficultyCategories, outcomeValues, reviewSteps, type AfterMealReview, type AfterMealReviewDraft } from '../../types/afterMealReview';

const draftKey = (childId: string, mealId: string) => `nurturebites.after-meal.${childId}.${mealId}.draft.v1`;
const resultKey = (childId: string, mealId: string) => `nurturebites.after-meal.${childId}.${mealId}.result.v1`;
const queues = new Map<string, Promise<unknown>>();
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const validOutcome = (value: unknown) => value === null || outcomeValues.includes(value as never);
const validDecision = (value: unknown) => record(value) && validOutcome(value.confirmed) && validOutcome(value.suggested);

function validReview(value: unknown, childId: string, mealId: string): value is AfterMealReviewDraft {
  if (!record(value) || value.childId !== childId || value.mealId !== mealId
    || !reviewSteps.includes(value.step as never)
    || !(value.afterPhoto === null || (record(value.afterPhoto)
      && typeof value.afterPhoto.id === 'string' && typeof value.afterPhoto.uri === 'string' && typeof value.afterPhoto.mimeType === 'string'))
    || !Array.isArray(value.outcomes) || !record(value.difficulties) || !record(value.difficultyInputs) || !record(value.suggestionFeedback)
    || !(value.comparisonMethod === null || value.comparisonMethod === 'ai' || value.comparisonMethod === 'manual')
    || !(value.goalFeedback === null || ['achieved', 'tried', 'notYet'].includes(value.goalFeedback as string))) return false;
  if (!value.outcomes.every((food: unknown) => record(food) && typeof food.foodId === 'string'
    && validDecision(food.decision) && Array.isArray(food.ingredients)
    && food.ingredients.every((ingredient: unknown) => record(ingredient)
      && typeof ingredient.id === 'string' && typeof ingredient.name === 'string' && validDecision(ingredient.decision)))) return false;
  const foodIds = value.outcomes.map((food: { foodId: string }) => food.foodId);
  if (new Set(foodIds).size !== foodIds.length || value.outcomes.some((food: { ingredients: { id: string }[] }) => {
    const ids = food.ingredients.map((ingredient) => ingredient.id);
    return new Set(ids).size !== ids.length;
  })) return false;
  if (!Object.values(value.difficulties).every((tags) => Array.isArray(tags) && tags.every((tag: unknown) =>
    record(tag) && typeof tag.id === 'string' && difficultyCategories.includes(tag.category as never)
      && typeof tag.value === 'string' && (tag.note === undefined || typeof tag.note === 'string')))) return false;
  if (!Object.values(value.difficultyInputs).every((input) => record(input)
    && (input.category === null || difficultyCategories.includes(input.category as never))
    && typeof input.value === 'string' && typeof input.note === 'string')) return false;
  return Object.values(value.suggestionFeedback).every((choice) => choice === 'tried' || choice === 'notTried');
}

function validFinal(value: unknown, childId: string, mealId: string): value is AfterMealReview {
  if (!record(value) || typeof value.savedAt !== 'string'
    || !(value.foodFormKeys === undefined || (record(value.foodFormKeys)
      && Object.values(value.foodFormKeys).every((key) => typeof key === 'string')))) return false;
  const draft = { ...value, step: 'complete', difficultyInputs: {} };
  return validReview(draft, childId, mealId)
    && draft.afterPhoto !== null
    && draft.outcomes.length > 0
    && draft.outcomes.every((food) => food.decision.confirmed !== null
      && food.ingredients.every((ingredient) => ingredient.decision.confirmed !== null));
}

function queued<T>(key: string, work: () => Promise<T>): Promise<T> {
  const next = (queues.get(key) ?? Promise.resolve()).catch(() => undefined).then(work);
  queues.set(key, next);
  void next.finally(() => { if (queues.get(key) === next) queues.delete(key); }).catch(() => undefined);
  return next;
}

export async function readAfterMealDraft(childId: string, mealId: string): Promise<AfterMealReviewDraft | null> {
  const key = draftKey(childId, mealId);
  await queues.get(key)?.catch(() => undefined);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (!validReview(value, childId, mealId)) throw new Error('Invalid after-meal draft');
  return value;
}

export function saveAfterMealDraft(draft: AfterMealReviewDraft): Promise<void> {
  const key = draftKey(draft.childId, draft.mealId);
  return queued(key, async () => {
    if (!validReview(draft, draft.childId, draft.mealId)) throw new Error('Invalid after-meal draft');
    await AsyncStorage.setItem(key, JSON.stringify(draft));
  });
}

export async function readAfterMealReview(childId: string, mealId: string): Promise<AfterMealReview | null> {
  const raw = await AsyncStorage.getItem(resultKey(childId, mealId));
  if (!raw) return null;
  const value: unknown = JSON.parse(raw);
  if (!validFinal(value, childId, mealId)) throw new Error('Invalid after-meal review');
  return value;
}

export function saveAfterMealReview(review: AfterMealReview): Promise<AfterMealReview> {
  const key = draftKey(review.childId, review.mealId);
  return queued(key, async () => {
    if (!validFinal(review, review.childId, review.mealId)) throw new Error('Invalid after-meal review');
    const existing = await readAfterMealReview(review.childId, review.mealId);
    if (existing) return existing;
    await AsyncStorage.setItem(resultKey(review.childId, review.mealId), JSON.stringify(review));
    await AsyncStorage.setItem(key, JSON.stringify({ ...review, step: 'complete', difficultyInputs: {} }));
    return review;
  });
}
