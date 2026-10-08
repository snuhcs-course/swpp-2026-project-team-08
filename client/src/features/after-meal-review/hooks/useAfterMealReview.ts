import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useHomeRecords } from '../../../data/queries/homeQueries';
import { useMeal, useMeals, useUpdateMealFoods } from '../../../data/queries/mealQueries';
import { afterMealKeys, useCompareMealPhotos, useSaveAfterMealReview } from '../../../data/queries/afterMealReviewQueries';
import { isMealPhotoReadable, pickMealPhoto, PhotoError } from '../../../data/device/mealPhotoPicker';
import { readAfterMealDraft, readAfterMealReview, saveAfterMealDraft } from '../../../data/storage/afterMealReviewStorage';
import { toggleFoodTrait } from '../../../rules/foodTraits';
import { newFood } from '../../../rules/foodDraft';
import { savedSuggestionsForProfile } from '../../../rules/savedSuggestions';
import type { AfterMealReviewDraft, DifficultyCategory, GoalFeedback, Outcome, ReviewStep, SuggestionFeedback } from '../../../types/afterMealReview';
import type { FoodItem, FoodTraits, PhotoSource, TraitGroup } from '../../../types/meal';
import type { ChildProfile } from '../../../types/profile';
import { addDifficulty, allOutcomesConfirmed, applySuggestions, canAddDifficulty, newReviewDraft, reconcileOutcomes, reviewFromDraft, setOutcome } from '../rules';

type SaveStatus = 'saving' | 'saved' | 'error';

export function useAfterMealReview(profile: ChildProfile | null, mealId: string) {
  const childId = profile?.id ?? '';
  const mealQuery = useMeal(childId, mealId);
  const client = useQueryClient();
  const homeQuery = useHomeRecords(childId);
  const mealsQuery = useMeals(childId);
  const compareMutation = useCompareMealPhotos();
  const saveMutation = useSaveAfterMealReview();
  const updateMealMutation = useUpdateMealFoods();
  const [draft, setDraft] = useState<AfterMealReviewDraft | null>(null);
  const current = useRef<AfterMealReviewDraft | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [photoError, setPhotoError] = useState<'permission' | 'image' | null>(null);
  const [compareError, setCompareError] = useState(false);
  const [picking, setPicking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [editingTraits, setEditingTraits] = useState<FoodTraits | null>(null);
  const [ingredient, setIngredient] = useState('');
  const [customTrait, setCustomTrait] = useState({ color: '', shape: '' });
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const saveVersion = useRef(0);
  const skipFirstSave = useRef(true);
  const finishing = useRef(false);
  const pickBusy = useRef(false);
  const pickVersion = useRef(0);
  const editorBusy = useRef(false);
  const compareVersion = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const key = `${childId}:${mealId}`;
  const meal = mealQuery.data ?? null;
  const ready = loadedKey === key && draft !== null && meal !== null;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!meal || !profile || loadedKey === key) return;
    let active = true;
    Promise.all([readAfterMealDraft(childId, mealId), readAfterMealReview(childId, mealId)]).then(
      ([stored, saved]) => {
        if (!active) return;
        const base = stored ?? (saved ? { ...saved, step: 'complete' as const, difficultyInputs: {} } : newReviewDraft(meal));
        const next: AfterMealReviewDraft = {
          ...base,
          step: saved ? 'complete' : base.step === 'comparing' ? 'compare' : base.step,
          outcomes: reconcileOutcomes(base.outcomes, meal.foods),
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
  const go = (step: ReviewStep) => update({ step });
  const cancelComparison = () => {
    ++compareVersion.current;
    controller.current?.abort();
    controller.current = null;
    setElapsedSeconds(0);
    if (current.current?.step === 'comparing') go('compare');
  };
  const back = (): boolean => {
    const step = current.current?.step;
    if (!step || step === 'photo' || step === 'complete') return false;
    if (step === 'comparing') { cancelComparison(); return true; }
    const previous: Partial<Record<ReviewStep, ReviewStep>> = {
      preview: 'photo', compare: 'preview', 'comparison-error': 'compare',
      outcomes: current.current?.comparisonMethod === 'manual' && !current.current.afterPhoto ? 'photo' : 'compare',
      difficulties: 'outcomes', goal: 'difficulties', suggestions: meal?.exposureFoodId ? 'goal' : 'difficulties',
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
      if (request !== pickVersion.current || !photo) return;
      cancelComparison();
      const value = current.current;
      if (!value) return;
      update({ afterPhoto: photo, step: 'preview', outcomes: applySuggestions(value.outcomes, []) });
    } catch (error) {
      if (request === pickVersion.current) setPhotoError(error instanceof PhotoError ? error.code : 'image');
    } finally {
      pickBusy.current = false;
      if (mounted.current) setPicking(false);
    }
  };
  const removePhoto = () => {
    ++pickVersion.current;
    cancelComparison();
    const value = current.current;
    if (!value) return;
    setPhotoError(null);
    update({ afterPhoto: null, step: 'photo', outcomes: applySuggestions(value.outcomes, []) });
  };

  const compare = async () => {
    const value = current.current;
    if (!meal?.photo || !value?.afterPhoto) { setCompareError(true); return; }
    const before = meal.photo;
    const after = value.afterPhoto;
    const request = ++compareVersion.current;
    controller.current?.abort();
    const signal = new AbortController();
    controller.current = signal;
    setCompareError(false);
    setElapsedSeconds(0);
    go('comparing');
    const started = Date.now();
    const timer = setInterval(() => { if (mounted.current) setElapsedSeconds(Math.floor((Date.now() - started) / 1000)); }, 500);
    try {
      const readable = await Promise.all([isMealPhotoReadable(before), isMealPhotoReadable(after)]);
      if (request !== compareVersion.current) return;
      if (!readable.every(Boolean)) throw new Error('Unreadable photo');
      const result = await compareMutation.mutateAsync({ mealId: meal.id, before, after, foods: meal.foods, signal: signal.signal });
      const latest = current.current;
      if (request !== compareVersion.current || !latest || result.mealId !== meal.id
        || latest.afterPhoto?.id !== result.afterPhotoId || meal.photo.id !== result.beforePhotoId) return;
      update({ outcomes: applySuggestions(latest.outcomes, result.suggestions), comparisonMethod: 'ai', step: 'outcomes' });
    } catch {
      if (request === compareVersion.current && !signal.signal.aborted) { setCompareError(true); go('comparison-error'); }
    } finally {
      clearInterval(timer);
      if (request === compareVersion.current) controller.current = null;
    }
  };
  const manual = () => {
    cancelComparison();
    const value = current.current;
    if (!value) return;
    setCompareError(false);
    update({ outcomes: applySuggestions(value.outcomes, []), comparisonMethod: 'manual', step: 'outcomes' });
  };
  const chooseOutcome = (foodId: string, outcome: Outcome, ingredientKey?: string) => {
    const value = current.current;
    if (value) update({ outcomes: setOutcome(value.outcomes, foodId, outcome, ingredientKey) });
  };

  const setDifficultyInput = (foodId: string, patch: Partial<{ category: DifficultyCategory | null; value: string; note: string }>) => {
    const value = current.current;
    if (!value) return;
    const old = value.difficultyInputs[foodId] ?? { category: null, value: '', note: '' };
    update({ difficultyInputs: { ...value.difficultyInputs, [foodId]: { ...old, ...patch } } });
  };
  const addDifficultyTag = (foodId: string) => {
    const value = current.current;
    const input = value?.difficultyInputs[foodId];
    if (!value || !input || !canAddDifficulty(input.category, input.value, input.note)) return;
    const currentTags = value.difficulties[foodId] ?? [];
    update({
      difficulties: { ...value.difficulties, [foodId]: addDifficulty(currentTags, input.category!, input.value, input.note) },
      difficultyInputs: { ...value.difficultyInputs, [foodId]: { category: input.category, value: '', note: '' } },
    });
  };
  const removeDifficultyTag = (foodId: string, tagId: string) => {
    const value = current.current;
    if (!value) return;
    update({ difficulties: { ...value.difficulties, [foodId]: (value.difficulties[foodId] ?? []).filter((tag) => tag.id !== tagId) } });
  };
  const markSuggestion = (suggestionId: string, result: SuggestionFeedback) => {
    const value = current.current;
    if (value) update({ suggestionFeedback: { ...value.suggestionFeedback, [suggestionId]: result } });
  };

  const editFood = (food?: FoodItem) => {
    const item = food ?? newFood();
    setEditingFood({ ...item, ingredients: [...item.ingredients], traits: Object.fromEntries(
      Object.entries(item.traits).map(([key, values]) => [key, [...values]]),
    ) as FoodTraits });
    setIngredient('');
    setCustomTrait({ color: '', shape: '' });
    setEditingTraits(null);
  };
  const changeFood = (patch: Partial<FoodItem>) => setEditingFood((old) => old ? { ...old, ...patch } : null);
  const saveFood = async () => {
    if (!editingFood?.name.trim() || !meal || !profile || editorBusy.current) return;
    editorBusy.current = true;
    const item: FoodItem = { ...editingFood, name: editingFood.name.trim(), source: 'parent' };
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
      setEditingTraits(null);
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
  const toggleTrait = (group: TraitGroup, value: string) => setEditingTraits((old) => old ? toggleFoodTrait(old, group, value) : null);

  const finish = async (): Promise<boolean> => {
    const value = current.current;
    if (!value || !meal || finishing.current || !allOutcomesConfirmed(value.outcomes)) return false;
    finishing.current = true;
    try {
      await persist(value);
      await saveChain.current;
      const review = reviewFromDraft(value, meal);
      await saveMutation.mutateAsync(review);
      update({ step: 'complete' });
      return true;
    } catch { setSaveStatus('error'); return false; }
    finally { finishing.current = false; }
  };

  const savedSuggestions = homeQuery.data && mealsQuery.data && profile
    ? savedSuggestionsForProfile(homeQuery.data, profile, mealsQuery.data) : [];
  return {
    meal, draft: ready ? draft : null,
    loading: !!mealId && (mealQuery.isPending || (!!meal && !ready && !loadError)),
    missingMeal: !mealId || (mealQuery.isSuccess && !meal),
    loadError: mealQuery.isError || loadError,
    retryLoad: () => { void mealQuery.refetch(); setLoadError(false); setLoadedKey(null); setLoadVersion((value) => value + 1); },
    saveStatus, photoError, compareError, picking, elapsedSeconds,
    markImageError: () => setPhotoError('image'),
    comparing: compareMutation.isPending, saving: saveMutation.isPending,
    editingFood, editingTraits, ingredient, customTrait, editorSaving: updateMealMutation.isPending,
    savedSuggestions, suggestionsLoading: homeQuery.isPending || mealsQuery.isPending,
    canContinueOutcomes: !!draft && allOutcomesConfirmed(draft.outcomes),
    update, go, back, pick, removePhoto, compare, cancelComparison, manual, chooseOutcome,
    setDifficultyInput, addDifficultyTag, removeDifficultyTag,
    setGoalFeedback: (result: GoalFeedback) => update({ goalFeedback: result }),
    markSuggestion, finish, retrySave: () => current.current ? persist(current.current) : Promise.resolve(),
    editFood, removeFood, changeFood, saveFood, cancelFoodEdit: () => { setEditingFood(null); setEditingTraits(null); },
    setIngredient, addIngredient,
    removeIngredient: (name: string) => editingFood && changeFood({ ingredients: editingFood.ingredients.filter((item) => item !== name) }),
    setCustomTrait: (group: 'color' | 'shape', text: string) => setCustomTrait((old) => ({ ...old, [group]: text })),
    addCustomTrait: (group: 'color' | 'shape') => {
      const text = customTrait[group].trim();
      if (text && editingTraits && !editingTraits[group].includes(text)) toggleTrait(group, text);
      setCustomTrait((old) => ({ ...old, [group]: '' }));
    },
    setEditingTraits, toggleTrait,
    saveTraits: () => { if (editingTraits) changeFood({ traits: editingTraits }); setEditingTraits(null); },
  };
}
