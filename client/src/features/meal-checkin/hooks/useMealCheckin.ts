// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; removed photo analysis flow
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

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
  FoodTraits,
  MealDraft,
  MealStep,
  PhotoSource,
  TraitGroup,
} from '../../../types/meal';
import { toggleFoodTrait } from '../../../rules/foodTraits';
import { newFood } from '../../../rules/foodDraft';
import {
  confirmFoods,
  mealFromDraft,
  newDraft,
} from '../rules';

export function useMealCheckin(childId: string, startAfterMealId?: string, freshAfterComplete = false) {
  const [draft, setDraft] = useState<MealDraft | null>(null);
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
  const [traits, setTraits] = useState<FoodTraits | null>(null);
  const [sheet, setSheet] = useState<'help' | 'privacy' | null>(null);
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
    if (traits) {
      setTraits(null);
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
      goal: 'foods',
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
  const save = async (skip: boolean) => {
    if (!current.current || busy.current) return null;
    const value = {
      ...current.current,
      exposureFoodId: skip ? null : current.current.exposureFoodId,
    };
    if (!skip && !value.exposureFoodId) return null;
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
  const edit = (food?: FoodItem) =>
    update({
      editingFood: food
        ? {
            ...food,
            ingredients: [...food.ingredients],
            traits: Object.fromEntries(
              Object.entries(food.traits).map(([key, values]) => [
                key,
                [...values],
              ]),
            ) as FoodTraits,
          }
        : newFood(),
    });
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
      source: 'parent',
      origin: food.origin ?? food.source,
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
    traits,
    sheet,
    setSheet,
    setTraits,
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
        exposureFoodId:
          current.current?.exposureFoodId === id
            ? null
            : (current.current?.exposureFoodId ?? null),
      });
    },
    removePhoto: () => {
      const value = current.current;
      if (!value) return;
      update({
        photo: null,
        step: 'photo',
        foods: value.foods,
        exposureFoodId: value.exposureFoodId,
      });
    },
    confirm: () => {
      if (current.current?.foods.length)
        update({ foods: confirmFoods(current.current.foods), step: 'foods', exposureFoodId: null });
    },
    toggleTrait: (group: TraitGroup, value: string) => {
      setTraits((current) =>
        current ? toggleFoodTrait(current, group, value) : null,
      );
    },
    saveTraits: () => {
      if (traits) {
        changeFood({ traits });
        setTraits(null);
      }
    },
    flush: () =>
      !busy.current && current.current
        ? persist(current.current)
        : Promise.resolve(false),
  };
}
