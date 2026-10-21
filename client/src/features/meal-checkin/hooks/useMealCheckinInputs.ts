// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
import { useState } from 'react';
import type { FoodItem, MealDraft } from '../../../types/meal';
import { localDate } from '../../../util/date';

type DateParts = [number, number, number];
type DateFieldIndex = 0 | 1 | 2 | null;

export function useMealCheckinInputs({
  draft,
  onUpdate,
  onEditFood,
  onChangeFood,
}: {
  draft: MealDraft | null;
  onUpdate: (value: Partial<MealDraft>) => void;
  onEditFood: (food?: FoodItem) => void;
  onChangeFood: (value: Partial<FoodItem>) => void;
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
  const confirmDate = () => {
    const [year, month, day] = dateParts;
    const dayCount = new Date(year, month, 0).getDate();
    onUpdate({ mealDate: localDate(new Date(year, month - 1, Math.min(day, dayCount))) });
    setDateField(null);
    setDateOpen(false);
  };
  const addIngredient = () => {
    const value = ingredient.trim();
    if (value && draft?.editingFood && !draft.editingFood.ingredients.includes(value)) {
      onChangeFood({ ingredients: [...draft.editingFood.ingredients, value] });
    }
    setIngredient('');
  };
  const selectIngredient = (name: string) => {
    if (draft?.editingFood && !draft.editingFood.ingredients.includes(name)) {
      onChangeFood({ ingredients: [...draft.editingFood.ingredients, name] });
    }
    setIngredient('');
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
      onConfirm: confirmDate,
    },
    food: {
      ingredient,
      onIngredientChange: setIngredient,
      onAddIngredient: addIngredient,
      onSelectIngredient: selectIngredient,
      onRemoveIngredient: removeIngredient,
    },
  };
}
