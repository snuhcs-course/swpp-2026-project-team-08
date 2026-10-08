import { useState } from 'react';
import type { FoodItem, FoodTraits, MealDraft, TraitGroup } from '../../../types/meal';
import { localDate } from '../../../util/date';

type DateParts = [number, number, number];
type DateFieldIndex = 0 | 1 | 2 | null;

export function useMealCheckinInputs({
  draft,
  traits,
  onUpdate,
  onEditFood,
  onChangeFood,
  onToggleTrait,
}: {
  draft: MealDraft | null;
  traits: FoodTraits | null;
  onUpdate: (value: Partial<MealDraft>) => void;
  onEditFood: (food?: FoodItem) => void;
  onChangeFood: (value: Partial<FoodItem>) => void;
  onToggleTrait: (group: TraitGroup, value: string) => void;
}) {
  const [dateOpen, setDateOpen] = useState(false);
  const [dateField, setDateField] = useState<DateFieldIndex>(null);
  const [dateParts, setDateParts] = useState<DateParts>(() =>
    (draft?.mealDate ?? localDate()).split('-').map(Number) as DateParts,
  );
  const [ingredient, setIngredient] = useState('');
  const [customTrait, setCustomTrait] = useState({ color: '', shape: '' });

  const editFood = (food?: FoodItem) => {
    setIngredient('');
    setCustomTrait({ color: '', shape: '' });
    onEditFood(food);
  };
  const toggleDate = () => {
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
    setDateOpen(false);
  };
  const addIngredient = () => {
    const value = ingredient.trim();
    if (value && draft?.editingFood && !draft.editingFood.ingredients.includes(value)) {
      onChangeFood({ ingredients: [...draft.editingFood.ingredients, value] });
    }
    setIngredient('');
  };
  const removeIngredient = (value: string) => {
    if (!draft?.editingFood) return;
    onChangeFood({ ingredients: draft.editingFood.ingredients.filter((item) => item !== value) });
  };
  const addCustomTrait = (group: 'color' | 'shape') => {
    const value = customTrait[group].trim();
    if (value && !traits?.[group].includes(value)) onToggleTrait(group, value);
    setCustomTrait((current) => ({ ...current, [group]: '' }));
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
      onRemoveIngredient: removeIngredient,
      custom: customTrait,
      onCustomChange: (group: 'color' | 'shape', value: string) =>
        setCustomTrait((current) => ({ ...current, [group]: value })),
      onAddCustomTrait: addCustomTrait,
    },
  };
}
