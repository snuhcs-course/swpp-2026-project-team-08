// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 재료 단위 추천 연결 제거
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: 입력 없는 첫 단계 식사 초안 저장 및 복원 방지
// AI-generated with Grok 4.6, 2026-11-13, reviewed by Doyeon Kim
// Changed: 음식 편집에서 저장 추천 연결 및 Record a Try 미리 채움
// AI-generated with GPT-6, 2026-11-13, reviewed by Haechan Jung
// Changed: 편집 추천 연결 초안·취소 및 Record a Try 자동 연결과 해제

import { hasMealDraftInput } from '../../../rules/mealDraft';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
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

function snapshotLink(selected: MealSuggestionOption, foodId: string) {
  return {
    suggestionId: selected.id,
    foodId,
    title: selected.title,
    description: selected.description,
    servingTip: selected.servingTip,
  };
}

export function useMealCheckin(childId: string, startAfterMealId?: string, freshAfterComplete = false, suggestions: readonly MealSuggestionOption[] = [], initialSuggestionId = '', onStopTrying?: () => void) {
  const [draft, setDraft] = useState<MealDraft | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSuggestionId, setPickerSuggestionId] = useState('');
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
  const pendingTryLink = useRef(false);
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
  const persist = useCallback(async (value: MealDraft) => {
    const revision = ++version.current;
    setSaveStatus('saving');
    try {
      await saveMealDraft(value);
      if (mounted.current && revision === version.current) {
        setSaveStatus('saved');
        client.setQueryData(mealKeys.draft(value.childId), hasMealDraftInput(value) ? value : null);
      }
      return true;
    } catch {
      if (mounted.current && revision === version.current)
        setSaveStatus('error');
      return false;
    }
  }, [client]);
  const update = useCallback((patch: Partial<MealDraft>) => {
    if (!current.current || busy.current) return;
    const value = { ...current.current, ...patch };
    current.current = value;
    setDraft(value);
    void persist(value);
  }, [persist]);
  useEffect(() => {
    const value = current.current;
    const food = value?.editingFood;
    if (!pendingTryLink.current || !food || busy.current) return;
    if (value.foods.some((item) => item.id === food.id)) {
      pendingTryLink.current = false;
      return;
    }
    const selected = suggestions.find((item) => item.id === initialSuggestionId);
    if (!selected) return;
    pendingTryLink.current = false;
    const links = value.suggestionLinks ?? [];
    if (links.some((link) => link.suggestionId === selected.id)) return;
    update({ editingSuggestionLink: snapshotLink(selected, food.id) });
  }, [suggestions, initialSuggestionId, update]);
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
    if (pickerOpen) {
      setPickerOpen(false);
      return true;
    }
    if (current.current.editingFood) {
      cancelEdit();
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
      if (value.foods.length === 1 && !(value.suggestionLinks ?? []).some((link) => link.foodId === value.foods[0].id)) {
        value = {
          ...value,
          suggestionLinks: [
            ...(value.suggestionLinks ?? []),
            { suggestionId: selected.id, foodId: value.foods[0].id,
              title: selected.title,
              description: selected.description, servingTip: selected.servingTip },
          ],
        };
      }
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
  const edit = (food?: FoodItem) => {
    if (!current.current || busy.current) return;
    if (food) {
      pendingTryLink.current = false;
      update({
        editingFood: {
          ...food,
          ingredients: [...food.ingredients],
        },
        editingSuggestionLink: current.current.suggestionLinks?.find((link) => link.foodId === food.id) ?? null,
      });
      return;
    }
    const next = newFood();
    const selected = suggestions.find((item) => item.id === initialSuggestionId);
    const links = current.current.suggestionLinks ?? [];
    if (selected && !links.some((link) => link.suggestionId === selected.id)) {
      pendingTryLink.current = false;
      update({ editingFood: next, editingSuggestionLink: snapshotLink(selected, next.id) });
      return;
    }
    pendingTryLink.current = !!initialSuggestionId && !selected;
    update({ editingFood: next, editingSuggestionLink: null });
  };
  const cancelEdit = () => {
    const value = current.current;
    if (!value?.editingFood || busy.current) return;
    pendingTryLink.current = false;
    setPickerOpen(false);
    update({
      editingFood: null,
      editingSuggestionLink: null,
    });
  };
  const changeFood = (patch: Partial<FoodItem>) => {
    if (current.current?.editingFood)
      update({ editingFood: { ...current.current.editingFood, ...patch } });
  };
  const saveFood = () => {
    const value = current.current;
    const food = value?.editingFood;
    if (!value || !food?.name.trim() || busy.current) return;
    const waitingForTry = pendingTryLink.current;
    pendingTryLink.current = false;
    const item: FoodItem = {
      ...food,
      name: food.name.trim(),
      confirmed: true,
    };
    const foods = value.foods;
    const link = value.editingSuggestionLink;
    const links = (value.suggestionLinks ?? []).filter((old) =>
      old.foodId !== food.id && (!link || old.suggestionId !== link.suggestionId));
    const nextLinks = link ? [...links, link] : links;
    update({
      foods: foods.some((f) => f.id === item.id)
        ? foods.map((f) => (f.id === item.id ? item : f))
        : [...foods, item],
      editingFood: null,
      editingSuggestionLink: null,
      suggestionLinks: nextLinks,
    });
    // Only a saved edit cancels the try intent; Cancel must preserve it.
    if (initialSuggestionId && !waitingForTry &&
      (!foods.some((old) => old.id === food.id) || value.suggestionLinks?.some((old) =>
        old.foodId === food.id && old.suggestionId === initialSuggestionId)) &&
      !nextLinks.some((next) => next.suggestionId === initialSuggestionId)) {
      onStopTrying?.();
    }
  };
  const clearTryingSuggestion = (id: string) => {
    const value = current.current;
    if (!value || busy.current || !id) return;
    pendingTryLink.current = false;
    setPickerSuggestionId((selected) => selected === id ? '' : selected);
    setRemoved((previous) => previous ? {
      ...previous, links: previous.links.filter((link) => link.suggestionId !== id),
    } : null);
    update({
      suggestionLinks: value.suggestionLinks?.filter((link) => link.suggestionId !== id),
      editingSuggestionLink: value.editingSuggestionLink?.suggestionId === id
        ? null : value.editingSuggestionLink,
    });
  };
  return {
    draft,
    suggestionLinking: {
      pickerOpen,
      selectedSuggestionId: pickerSuggestionId,
      canOpenPicker: suggestions.length > 0,
      onOpenPicker: () => {
        if (!suggestions.length) return;
        const linked = current.current?.editingSuggestionLink;
        setPickerSuggestionId(linked?.suggestionId ?? '');
        setPickerOpen(true);
      },
      onClosePicker: () => setPickerOpen(false),
      onSelectSuggestion: setPickerSuggestionId,
      onLink: (foodId) => {
        const value = current.current;
        const selected = suggestions.find((item) => item.id === pickerSuggestionId);
        if (!value || busy.current || !selected || value.editingFood?.id !== foodId) return;
        pendingTryLink.current = false;
        update({ editingSuggestionLink: snapshotLink(selected, foodId) });
        setPickerOpen(false);
      },
      onUnlink: (id) => {
        const value = current.current;
        if (!value || busy.current) return;
        if (value.editingFood) {
          pendingTryLink.current = false;
          update({ editingSuggestionLink: null });
        } else if (id === initialSuggestionId) {
          clearTryingSuggestion(id);
          onStopTrying?.();
        } else {
          update({ suggestionLinks: value.suggestionLinks?.filter((link) => link.suggestionId !== id) });
        }
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
    cancelEdit,
    changeFood,
    saveFood,
    clearTryingSuggestion,
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
