// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMeal, useUpdateMealFoods } from '../../../data/queries/mealQueries';
import { afterMealKeys, useSaveAfterMealReview } from '../../../data/queries/afterMealReviewQueries';
import { pickMealPhoto, PhotoError } from '../../../data/device/mealPhotoPicker';
import { readAfterMealDraft, readAfterMealReview, saveAfterMealDraft } from '../../../data/storage/afterMealReviewStorage';
import { newFood } from '../../../rules/foodDraft';
import type { AfterMealReviewDraft, DifficultyCategory, Outcome, ReviewStep } from '../../../types/afterMealReview';
import type { FoodItem, PhotoSource } from '../../../types/meal';
import type { ChildProfile } from '../../../types/profile';
import { addDifficulty, allOutcomesConfirmed, clearOutcomeSuggestions, canAddDifficulty, newReviewDraft, normalizeReviewStep, reconcileOutcomes, reviewFromDraft, setOutcome, toggleIngredient } from '../rules';

type SaveStatus = 'saving' | 'saved' | 'error';

export function useAfterMealReview(profile: ChildProfile | null, mealId: string) {
  const childId = profile?.id ?? '';
  const mealQuery = useMeal(childId, mealId);
  const client = useQueryClient();
  const saveMutation = useSaveAfterMealReview();
  const updateMealMutation = useUpdateMealFoods();
  const [draft, setDraft] = useState<AfterMealReviewDraft | null>(null);
  const current = useRef<AfterMealReviewDraft | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const [finalSaveState, setFinalSaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [photoError, setPhotoError] = useState<'permission' | 'image' | null>(null);
  const [picking, setPicking] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [ingredient, setIngredient] = useState('');
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const saveVersion = useRef(0);
  const skipFirstSave = useRef(true);
  const finishing = useRef(false);
  const pickBusy = useRef(false);
  const pickVersion = useRef(0);
  const editorBusy = useRef(false);
  const mounted = useRef(true);
  const key = `${childId}:${mealId}`;
  const meal = mealQuery.data ?? null;
  const ready = loadedKey === key && draft !== null && meal !== null;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!meal || !profile || loadedKey === key) return;
    let active = true;
    Promise.all([readAfterMealDraft(childId, mealId), readAfterMealReview(childId, mealId)]).then(
      ([stored, saved]) => {
        if (!active) return;
        setFinalSaveState('idle');
        const base = stored ?? (saved ? { ...saved, step: 'complete' as const, difficultyInputs: {} } : newReviewDraft(meal));
        const next: AfterMealReviewDraft = {
          ...base,
          step: saved ? 'complete' : ['comparing', 'comparison-error'].includes(base.step) ? (meal.photo && base.afterPhoto ? 'compare' : 'outcomes') : base.step === 'compare' && (!meal.photo || !base.afterPhoto) ? 'outcomes' : normalizeReviewStep(base.step),
          outcomes: clearOutcomeSuggestions(reconcileOutcomes(base.outcomes, meal.foods)),
          comparisonMethod: 'manual',
        };
        skipFirstSave.current = true;
        current.current = next;
        setDraft(next);
        setLoadedKey(key);
        setLoadError(false);
      },
      () => { if (active) { setLoadError(true); setLoadedKey(key); } },
    );
    return () => { active = false; };
    // Reload only for a different Meal or an explicit retry; food edits reconcile in saveFood.
  }, [key, loadVersion, meal, mealId, profile, childId, loadedKey]);

  const persist = useCallback((value: AfterMealReviewDraft) => {
    const version = ++saveVersion.current;
    setSaveStatus('saving');
    saveChain.current = saveChain.current.catch(() => undefined).then(async () => {
      await saveAfterMealDraft(value);
      client.setQueryData(afterMealKeys.draft(value.childId, value.mealId), value);
    });
    saveChain.current.then(
      () => { if (mounted.current && version === saveVersion.current) setSaveStatus('saved'); },
      () => { if (mounted.current && version === saveVersion.current) setSaveStatus('error'); },
    );
    return saveChain.current;
  }, [client]);

  useEffect(() => {
    if (!ready || !draft || draft.step === 'complete' || finishing.current) return;
    if (skipFirstSave.current) { skipFirstSave.current = false; return; }
    void Promise.resolve().then(() => {
      if (!finishing.current && current.current?.step !== 'complete') return persist(draft);
    });
  }, [draft, ready, persist]);

  const update = (patch: Partial<AfterMealReviewDraft>) => {
    const value = current.current;
    if (!value) return;
    const next = { ...value, ...patch };
    current.current = next;
    setDraft(next);
  };
  // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
  const cancelPhotoPick = () => {
    ++pickVersion.current;
    pickBusy.current = false;
    setPicking(false);
  };
  const go = (step: ReviewStep) => {
    cancelPhotoPick();
    update({ step: normalizeReviewStep(step) });
  };
  const back = (): boolean => {
    const step = current.current?.step;
    if (!step || step === 'photo' || step === 'complete') return false;
    const previous: Partial<Record<ReviewStep, ReviewStep>> = {
      preview: 'photo', compare: 'preview', 'comparison-error': 'compare',
      outcomes: current.current?.afterPhoto ? (meal?.photo ? 'compare' : 'preview') : 'photo',
      difficulties: 'outcomes', suggestions: 'difficulties',
    };
    const target = previous[step];
    if (!target) return false;
    go(target);
    return true;
  };

  const pick = async (source: PhotoSource) => {
    if (pickBusy.current) return;
    pickBusy.current = true;
    const request = ++pickVersion.current;
    setPicking(true);
    setPhotoError(null);
    try {
      const photo = await pickMealPhoto(source);
      // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
      if (!mounted.current || request !== pickVersion.current || !photo) return;
      const value = current.current;
      if (!value) return;
      update({ afterPhoto: photo, step: 'preview', outcomes: clearOutcomeSuggestions(value.outcomes) });
    } catch (error) {
      // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
      if (mounted.current && request === pickVersion.current) setPhotoError(error instanceof PhotoError ? error.code : 'image');
    } finally {
      // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
      if (request === pickVersion.current) {
        pickBusy.current = false;
        if (mounted.current) setPicking(false);
      }
    }
  };
  const removePhoto = () => {
    // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
    cancelPhotoPick();
    const value = current.current;
    if (!value) return;
    setPhotoError(null);
    update({ afterPhoto: null, step: 'photo', outcomes: clearOutcomeSuggestions(value.outcomes) });
  };

  const manual = () => {
    // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
    cancelPhotoPick();
    const value = current.current;
    if (!value) return;
    update({ outcomes: clearOutcomeSuggestions(value.outcomes), comparisonMethod: 'manual', step: 'outcomes' });
  };
  const chooseOutcome = (foodId: string, outcome: Outcome, ingredientKey?: string) => {
    const value = current.current;
    if (value) update({ outcomes: setOutcome(value.outcomes, foodId, outcome, ingredientKey) });
  };

  const setDifficultyInput = (foodId: string, patch: Partial<{ category: DifficultyCategory | null; value: string; note: string; subcategory?: string }>) => {
    const value = current.current;
    if (!value) return;
    const old = value.difficultyInputs[foodId] ?? { category: null, value: '', note: '' };
    update({ difficultyInputs: { ...value.difficultyInputs, [foodId]: { ...old, ...patch } } });
  };
  const addDifficultyTag = (foodId: string) => {
    const value = current.current;
    const input = value?.difficultyInputs[foodId];
    if (!value || !input || !canAddDifficulty(input.category, input.value, input.note, input.subcategory)) return;
    const currentTags = value.difficulties[foodId] ?? [];
    update({
      difficulties: { ...value.difficulties, [foodId]: addDifficulty(currentTags, input.category!, input.value, input.note, input.subcategory) },
      difficultyInputs: { ...value.difficultyInputs, [foodId]: { category: input.category, value: '', note: '', subcategory: '' } },
    });
  };
  const removeDifficultyTag = (foodId: string, tagId: string) => {
    const value = current.current;
    if (!value) return;
    update({ difficulties: { ...value.difficulties, [foodId]: (value.difficulties[foodId] ?? []).filter((tag) => tag.id !== tagId) } });
  };
  const editFood = (food?: FoodItem) => {
    const item = food ?? newFood();
    setEditingFood({ ...item, ingredients: [...item.ingredients] });
    setIngredient('');
  };
  const changeFood = (patch: Partial<FoodItem>) => setEditingFood((old) => old ? { ...old, ...patch } : null);
  const saveFood = async () => {
    if (!editingFood?.name.trim() || !meal || !profile || editorBusy.current) return;
    editorBusy.current = true;
    // AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
    const item: FoodItem = { ...editingFood, name: editingFood.name.trim(), confirmed: true };
    const foods = meal.foods.some((food) => food.id === item.id)
      ? meal.foods.map((food) => food.id === item.id ? item : food)
      : [...meal.foods, item];
    try {
      const savedMeal = await updateMealMutation.mutateAsync({ childId: profile.id, mealId, foods });
      const value = current.current;
      if (value) update({
        outcomes: reconcileOutcomes(value.outcomes, savedMeal.foods),
        difficulties: Object.fromEntries(savedMeal.foods.map((food) => [food.id, value.difficulties[food.id] ?? []])),
        difficultyInputs: Object.fromEntries(savedMeal.foods.map((food) => [food.id, value.difficultyInputs[food.id] ?? { category: null, value: '', note: '' }])),
      });
      setEditingFood(null);
    } catch { setSaveStatus('error'); }
    finally { editorBusy.current = false; }
  };
  const removeFood = async (foodId: string) => {
    if (!meal || !profile || meal.foods.length <= 1 || editorBusy.current) return;
    editorBusy.current = true;
    try {
      const savedMeal = await updateMealMutation.mutateAsync({ childId: profile.id, mealId, foods: meal.foods.filter((food) => food.id !== foodId) });
      const value = current.current;
      if (value) update({
        outcomes: reconcileOutcomes(value.outcomes, savedMeal.foods),
        difficulties: Object.fromEntries(savedMeal.foods.map((food) => [food.id, value.difficulties[food.id] ?? []])),
        difficultyInputs: Object.fromEntries(savedMeal.foods.map((food) => [food.id, value.difficultyInputs[food.id] ?? { category: null, value: '', note: '' }])),
      });
    } catch { setSaveStatus('error'); }
    finally { editorBusy.current = false; }
  };
  const addIngredient = () => {
    const value = ingredient.trim();
    if (value && editingFood && !editingFood.ingredients.includes(value)) changeFood({ ingredients: [...editingFood.ingredients, value] });
    setIngredient('');
  };

  const finish = async (): Promise<boolean> => {
    const value = current.current;
    if (!value || !meal || finishing.current || !allOutcomesConfirmed(value.outcomes)) return false;
    finishing.current = true;
    setFinalSaveState('saving');
    try {
      await persist(value);
      await saveChain.current;
      const review = reviewFromDraft(value, meal);
      await saveMutation.mutateAsync(review);
      if (mounted.current && current.current?.mealId === value.mealId) {
        update({ step: 'complete' });
        setFinalSaveState('idle');
      }
      return true;
    } catch {
      if (mounted.current && current.current?.mealId === value.mealId) { setSaveStatus('error'); setFinalSaveState('error'); }
      return false;
    }
    finally { finishing.current = false; }
  };

  return {
    meal, draft: ready ? draft : null,
    loading: !!mealId && (mealQuery.isPending || (!!meal && !ready && !loadError)),
    missingMeal: !mealId || (mealQuery.isSuccess && !meal),
    loadError: mealQuery.isError || loadError,
    retryLoad: () => { void mealQuery.refetch(); setLoadError(false); setLoadedKey(null); setLoadVersion((value) => value + 1); },
    saveStatus, finalSaveState, photoError, picking,
    markImageError: () => setPhotoError('image'),
    saving: finalSaveState === 'saving',
    editingFood, ingredient, editorSaving: updateMealMutation.isPending,
    canContinueOutcomes: !!draft && allOutcomesConfirmed(draft.outcomes),
    toggleIngredient: (foodId: string, ingredientId: string) => { if (current.current) update({ outcomes: toggleIngredient(current.current.outcomes, foodId, ingredientId) }); },
    update, go, back, pick, removePhoto, manual, chooseOutcome,
    setDifficultyInput, addDifficultyTag, removeDifficultyTag,
    finish, retrySave: () => current.current ? persist(current.current) : Promise.resolve(),
    editFood, removeFood, changeFood, saveFood, cancelFoodEdit: () => { setEditingFood(null); },
    setIngredient, addIngredient,
    removeIngredient: (name: string) => editingFood && changeFood({ ingredients: editingFood.ingredients.filter((item) => item !== name) }),
  };
}
