// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
import { useState } from 'react';
import type { FoodItem, MealDraft } from '../../../types/meal';
import { localDate } from '../../../util/date';
import { getIngredientInput } from '../rules';
import type { IngredientCatalogStatus } from '../types';

type DateParts = [number, number, number];
type DateFieldIndex = 0 | 1 | 2 | null;

export function useMealCheckinInputs({
  draft,
  onUpdate,
  onEditFood,
  onChangeFood,
  ingredientOptions,
  ingredientCatalogStatus,
}: {
  draft: MealDraft | null;
  onUpdate: (value: Partial<MealDraft>) => void;
  onEditFood: (food?: FoodItem) => void;
  onChangeFood: (value: Partial<FoodItem>) => void;
  ingredientOptions: string[];
  ingredientCatalogStatus: IngredientCatalogStatus;
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const [dateField, setDateField] = useState<DateFieldIndex>(null);
  const [dateParts, setDateParts] = useState<DateParts>(() =>
    (draft?.mealDate ?? localDate()).split('-').map(Number) as DateParts,
  );
  const [ingredient, setIngredient] = useState('');

  const editFood = (food?: FoodItem) => {
    setIngredient('');
    onEditFood(food);
  };
  const toggleDate = () => {
    setDateField(null);
    if (draft) setDateParts(draft.mealDate.split('-').map(Number) as DateParts);
    setDateOpen((value) => !value);
  };
  const selectDateNumber = (number: number) => {
    if (dateField === null) return;
    const next: DateParts = [...dateParts];
    next[dateField] = number;
    next[2] = Math.min(next[2], new Date(next[0], next[1], 0).getDate());
    setDateParts(next);
    setDateField(null);
  };
  const changeDate = (date: Date) => {
    setDateParts([date.getFullYear(), date.getMonth() + 1, date.getDate()]);
  };
  const confirmDate = (date?: Date) => {
    const [year, month, day] = date
      ? [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      : dateParts;
    const dayCount = new Date(year, month, 0).getDate();
    onUpdate({ mealDate: localDate(new Date(year, month - 1, Math.min(day, dayCount))) });
    setDateField(null);
    setDateOpen(false);
  };
  // AI-generated with GPT-6, 2026-10-26, reviewed by Seoyeon Heo
  const ingredientInput = getIngredientInput(
    ingredient, draft?.editingFood?.ingredients ?? [], ingredientOptions, ingredientCatalogStatus,
  );
  const addIngredient = (name: string): boolean => {
    const food = draft?.editingFood;
    if (!food) return false;
    const result = getIngredientInput(name, food.ingredients, ingredientOptions, ingredientCatalogStatus);
    if (!result.canAdd || !result.match) return false;
    onChangeFood({ ingredients: [...food.ingredients, result.match] });
    setIngredient('');
    return true;
  };
  const removeIngredient = (value: string) => {
    if (!draft?.editingFood) return;
    onChangeFood({ ingredients: draft.editingFood.ingredients.filter((item) => item !== value) });
  };

  return {
    editFood,
    date: {
      parts: dateParts,
      open: dateOpen,
      field: dateField,
      onToggle: toggleDate,
      onFieldChange: setDateField,
      onNumberSelect: selectDateNumber,
      onDateChange: changeDate,
      onConfirm: confirmDate,
    },
    food: {
      ingredient,
      ingredientStatus: ingredientInput.status,
      ingredientChoices: ingredientInput.choices,
      canAddIngredient: ingredientInput.canAdd,
      onIngredientChange: setIngredient,
      onAddIngredient: () => addIngredient(ingredient),
      onSelectIngredient: addIngredient,
      onRemoveIngredient: removeIngredient,
    },
  };
}
