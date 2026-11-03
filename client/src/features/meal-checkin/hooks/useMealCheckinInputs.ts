// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-11-03, reviewed by Haechan Jung
// Changed: 날짜 선택 기본값과 상한을 현재 날짜로 제한

import { useState } from 'react';
import type { FoodItem, MealDraft } from '../../../types/meal';
import { capFutureDateAtToday, localDate } from '../../../util/date';
import { getIngredientInput } from '../rules';

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
    localDate(capFutureDateAtToday(new Date(`${draft?.mealDate ?? localDate()}T00:00:00`)))
      .split('-').map(Number) as DateParts,
  );
  const [ingredient, setIngredient] = useState('');

  const editFood = (food?: FoodItem) => {
    setIngredient('');
    onEditFood(food);
  };
  const toggleDate = () => {
    setDateField(null);
    changeDate(capFutureDateAtToday(new Date(`${draft?.mealDate ?? localDate()}T00:00:00`)));
    setDateOpen((value) => !value);
  };
  const selectDateNumber = (number: number) => {
    if (dateField === null) return;
    const next: DateParts = [...dateParts];
    next[dateField] = number;
    next[2] = Math.min(next[2], new Date(next[0], next[1], 0).getDate());
    changeDate(new Date(next[0], next[1] - 1, next[2]));
    setDateField(null);
  };
  const changeDate = (value: Date) => {
    const date = capFutureDateAtToday(value);
    setDateParts([date.getFullYear(), date.getMonth() + 1, date.getDate()]);
  };
  const confirmDate = (date?: Date) => {
    const [year, month, day] = date
      ? [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      : dateParts;
    const dayCount = new Date(year, month, 0).getDate();
    onUpdate({ mealDate: localDate(capFutureDateAtToday(new Date(year, month - 1, Math.min(day, dayCount)))) });
    setDateField(null);
    setDateOpen(false);
  };
  const ingredientInput = getIngredientInput(
    ingredient, draft?.editingFood?.ingredients ?? [],
  );
  const addIngredient = (name: string): boolean => {
    const food = draft?.editingFood;
    if (!food) return false;
    const result = getIngredientInput(name, food.ingredients);
    if (!result.canAdd) return false;
    onChangeFood({ ingredients: [...food.ingredients, result.name] });
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
      canAddIngredient: ingredientInput.canAdd,
      onIngredientChange: setIngredient,
      onAddIngredient: () => addIngredient(ingredient),
      onRemoveIngredient: removeIngredient,
    },
  };
}
