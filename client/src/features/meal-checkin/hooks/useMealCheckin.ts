// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  mealKeys,
  useSaveMeal,
} from '../../../data/queries/mealQueries';
import {
  readMealDraft,
  saveMealDraft,
} from '../../../data/storage/mealStorage';
import { pickMealPhoto, PhotoError } from '../../../data/device/mealPhotoPicker';
import type {
  FoodItem,
  MealDraft,
  MealStep,
  PhotoSource,
} from '../../../types/meal';
import { newFood } from '../../../rules/foodDraft';
import type { MealSuggestionLinking, MealSuggestionOption } from '../types';
import {
  confirmFoods,
  mealFromDraft,
  newDraft,
} from '../rules';

// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
export function useMealCheckin(childId: string, startAfterMealId?: string, freshAfterComplete = false, suggestions: readonly MealSuggestionOption[] = [], initialSuggestionId = '') {
  const [draft, setDraft] = useState<MealDraft | null>(null);
  // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
  const [linkStep, setLinkStep] = useState<0 | 1 | 2>(0);
  const [suggestionId, setSuggestionId] = useState(initialSuggestionId);
  const [targetId, setTargetId] = useState('');
  const resumeLink = useRef(false);
  const selectedSuggestion = suggestions.find((item) => item.id === suggestionId);
  const canLinkToFood = (suggestion: MealSuggestionOption, food: FoodItem) => {
    if (suggestion.ingredientId == null) return true;
    const targetName = suggestion.ingredientName;
    return !!targetName && food.ingredients.some((name) =>
      name.toLocaleLowerCase() === targetName.toLocaleLowerCase());
  };
  useEffect(() => {
    if (!draft?.editingFood && resumeLink.current) {
      resumeLink.current = false;
      setLinkStep(2);
    }
  }, [draft?.editingFood]);
  const [resumeRequired, setResumeRequired] = useState(false);
  const current = useRef<MealDraft | null>(null);
  const [removed, setRemoved] = useState<{ food: FoodItem; index: number; links: NonNullable<MealDraft['suggestionLinks']> } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error'>(
    'saved',
  );
  const [error, setError] = useState<'permission' | 'image' | 'save' | null>(
    null,
  );
  const [picking, setPicking] = useState(false);
  const [sheet, setSheet] = useState<'privacy' | null>(null);
  const client = useQueryClient();
  const saving = useSaveMeal();
  const busy = useRef(false);
  const pickBusy = useRef(false);
  const photoRequest = useRef(0);
  const version = useRef(0);
  const mounted = useRef(true);
  const load = async () => {
    setLoadError(false);
    try {
      const stored = await readMealDraft(childId);
      const value =
        stored?.step === 'complete' && (freshAfterComplete || stored.savedMealId === startAfterMealId)
          ? newDraft(childId)
          : (stored ?? newDraft(childId));
      if (mounted.current) {
        current.current = value;
        setResumeRequired(!!stored && stored.step !== 'complete');
        setDraft(value);
      }
    } catch {
      if (mounted.current) setLoadError(true);
    }
  };
  useEffect(() => {
    mounted.current = true;
    let active = true;
    readMealDraft(childId)
      .then((value) => {
        if (active) {
          const restored =
            value?.step === 'complete' && (freshAfterComplete || value.savedMealId === startAfterMealId)
              ? newDraft(childId)
              : (value ?? newDraft(childId));
          current.current = restored;
          setResumeRequired(!!value && value.step !== 'complete');
          setDraft(restored);
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [childId, startAfterMealId, freshAfterComplete]);
  const persist = async (value: MealDraft) => {
    const revision = ++version.current;
    setSaveStatus('saving');
    try {
      await saveMealDraft(value);
      if (mounted.current && revision === version.current) {
        setSaveStatus('saved');
        client.setQueryData(mealKeys.draft(value.childId), value);
      }
      return true;
    } catch {
      if (mounted.current && revision === version.current)
        setSaveStatus('error');
      return false;
    }
  };
  const update = (patch: Partial<MealDraft>) => {
    if (!current.current || busy.current) return;
    const value = { ...current.current, ...patch };
    current.current = value;
    setDraft(value);
    void persist(value);
  };
  const go = (step: MealStep) => {
    photoRequest.current += 1;
    pickBusy.current = false;
    setPicking(false);
    update({ step });
  };
  const back = () => {
    if (busy.current) return true;
    if (!current.current) return false;
    if (sheet) {
      setSheet(null);
      return true;
    }
    if (current.current.editingFood) {
      update({ editingFood: null });
      return true;
    }
    const step = current.current.step;
    if (step === 'details' || step === 'complete') return false;

    const previous: Partial<Record<MealStep, MealStep>> = {
      photo: 'details',
      preview: 'photo',
      foods: current.current.photo ? 'preview' : 'photo',
    };
    go(previous[step] ?? 'details');
    return true;
  };
  const pick = async (source: PhotoSource) => {
    if (busy.current || pickBusy.current) return;
    pickBusy.current = true;
    const request = ++photoRequest.current;
    setPicking(true);
    setError(null);
    try {
      const photo = await pickMealPhoto(source);
      if (photo && mounted.current && request === photoRequest.current) {
          setRemoved(null);
        update({
          photo,
          step: 'preview',
        });
      }
    } catch (err) {
      if (mounted.current && request === photoRequest.current)
        setError(err instanceof PhotoError ? err.code : 'image');
    } finally {
      if (request === photoRequest.current) {
        pickBusy.current = false;
        if (mounted.current) setPicking(false);
      }
    }
  };
  const save = async (linkSuggestionId?: string) => {
    if (!current.current || busy.current) return null;
    let value = current.current;
    if (linkSuggestionId && !(value.suggestionLinks ?? []).some((link) => link.suggestionId === linkSuggestionId)) {
      const selected = suggestions.find((item) => item.id === linkSuggestionId);
      if (!selected) {
        setError('save');
        return null;
      }
      if (value.foods.length !== 1 || !canLinkToFood(selected, value.foods[0])) {
        setSuggestionId(linkSuggestionId);
        setLinkStep(2);
        return null;
      }
      value = {
        ...value,
        suggestionLinks: [
          ...(value.suggestionLinks ?? []),
          { suggestionId: selected.id, foodId: value.foods[0].id, ingredientId: selected.ingredientId,
            title: selected.title,
            description: selected.description, servingTip: selected.servingTip },
        ],
      };
    }
    let meal;
    try {
      meal = mealFromDraft(value);
    } catch {
      return null;
    }
    current.current = value;
    setDraft(value);
    busy.current = true;
    setError(null);
    try {
      // Storage queues the final write after all preceding autosaves.
      const result = await saving.mutateAsync(meal);
      if (mounted.current) {
        const complete: MealDraft = {
          ...value,
          id: result.id,
          foods: result.foods,
          suggestionLinks: result.suggestionLinks,
          step: 'complete',
          savedMealId: result.id,
        };
        current.current = complete;
        setDraft(complete);
        setSaveStatus('saved');
      }
      return mounted.current ? result.id : null;
    } catch {
      if (mounted.current) setError('save');
      return null;
    } finally {
      busy.current = false;
    }
  };
  // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
  const edit = (food?: FoodItem) => {
    if (!current.current || busy.current) return;
    if (linkStep === 2) {
      resumeLink.current = true;
      setLinkStep(0);
    }
    update({
      editingFood: food
        ? {
            ...food,
            ingredients: [...food.ingredients],
          }
        : newFood(),
    });
  };
  const changeFood = (patch: Partial<FoodItem>) => {
    if (current.current?.editingFood)
      update({ editingFood: { ...current.current.editingFood, ...patch } });
  };
  const saveFood = () => {
    const food = current.current?.editingFood;
    if (!food?.name.trim()) return;
    const item: FoodItem = {
      ...food,
      name: food.name.trim(),
      // AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
      confirmed: true,
    };
    const foods = current.current?.foods ?? [];
    update({
      foods: foods.some((f) => f.id === item.id)
        ? foods.map((f) => (f.id === item.id ? item : f))
        : [...foods, item],
      editingFood: null,
    });
  };
  return {
    draft,
    // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
    suggestionLinking: {
      step: linkStep,
      selectedSuggestion,
      selectedFoodId: targetId,
      canContinue: !!selectedSuggestion && (linkStep === 1 || !!draft?.foods.some((food) =>
        food.id === targetId && canLinkToFood(selectedSuggestion, food))),
      onOpen: () => setLinkStep(1),
      onBack: () => setLinkStep(linkStep === 2 ? 1 : 0),
      onSelectSuggestion: (id) => { setSuggestionId(id); setTargetId(''); },
      onSelectFood: setTargetId,
      onContinue: () => {
        const value = current.current;
        if (!value || busy.current || !selectedSuggestion) return;
        if (linkStep === 1) { setLinkStep(2); return; }
        if (linkStep !== 2 || !value.foods.some((food) =>
          food.id === targetId && canLinkToFood(selectedSuggestion, food))) return;
        update({ suggestionLinks: [
          ...(value.suggestionLinks ?? []).filter((link) => link.suggestionId !== selectedSuggestion.id),
          { suggestionId: selectedSuggestion.id, foodId: targetId,
            ingredientId: selectedSuggestion.ingredientId, title: selectedSuggestion.title,
            description: selectedSuggestion.description, servingTip: selectedSuggestion.servingTip },
        ] });
        setLinkStep(0);
      },
      onUnlink: (id) => {
        if (current.current) update({ suggestionLinks: current.current.suggestionLinks?.filter((link) => link.suggestionId !== id) });
      },
    } satisfies MealSuggestionLinking,
    resumeRequired,
    continueDraft: () => setResumeRequired(false),
    loadError,
    removed,
    undoRemove: () => {
      const value = current.current;
      if (!value || !removed || busy.current) return;
      const foods = [...value.foods];
      foods.splice(Math.min(removed.index, foods.length), 0, removed.food);
      update({ foods, suggestionLinks: [...(value.suggestionLinks ?? []).filter((link) => !removed.links.some((old) => old.suggestionId === link.suggestionId)), ...removed.links] });
      setRemoved(null);
    },
    confirmFood: (id: string) => {
      if (current.current) update({ foods: current.current.foods.map((food) => food.id === id ? { ...food, confirmed: true } : food) });
    },
    reload: load,
    saveStatus,
    error,
    picking,
    saving: saving.isPending,
    sheet,
    setSheet,
    update,
    go,
    back,
    pick,
    save,
    edit,
    changeFood,
    saveFood,
    removeFood: (id: string) => {
      const value = current.current;
      const food = value?.foods.find((item) => item.id === id);
      if (!value || !food || busy.current) return;
      setRemoved({ food, index: value.foods.indexOf(food), links: (value.suggestionLinks ?? []).filter((link) => link.foodId === id) });
      update({
        suggestionLinks: (value.suggestionLinks ?? []).filter((link) => link.foodId !== id),
        foods: current.current?.foods.filter((f) => f.id !== id) ?? [],
      });
    },
    removePhoto: () => {
      const value = current.current;
      if (!value) return;
      update({
        photo: null,
        step: 'photo',
        foods: value.foods,
      });
    },
    confirm: () => {
      if (current.current?.foods.length)
        update({ foods: confirmFoods(current.current.foods), step: 'foods' });
    },
    flush: () =>
      !busy.current && current.current
        ? persist(current.current)
        : Promise.resolve(false),
  };
}
