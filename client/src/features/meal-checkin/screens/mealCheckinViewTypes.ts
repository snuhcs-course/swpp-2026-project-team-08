import type { PhotoSource } from '../../../data/api/mealPhotoApi';
import type { FoodItem, FoodTraits, MealDraft, MealStep, TraitGroup } from '../../../types/meal';
import type { Language } from '../../../types/profile';

type DateInput = {
  parts: [number, number, number];
  open: boolean;
  field: 0 | 1 | 2 | null;
  onToggle: () => void;
  onFieldChange: (field: 0 | 1 | 2 | null) => void;
  onNumberSelect: (number: number) => void;
  onConfirm: () => void;
};

type FoodInput = {
  ingredient: string;
  onIngredientChange: (value: string) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (value: string) => void;
  custom: { color: string; shape: string };
  onCustomChange: (group: 'color' | 'shape', value: string) => void;
  onAddCustomTrait: (group: 'color' | 'shape') => void;
};

export type MealCheckinViewProps = {
  draft: MealDraft;
  language: Language;
  saveStatus: 'saving' | 'saved' | 'error';
  error: 'permission' | 'image' | 'save' | null;
  picking: boolean;
  saving: boolean;
  traits: FoodTraits | null;
  sheet: 'help' | 'privacy' | null;
  languageError: boolean;
  dateInput: DateInput;
  foodInput: FoodInput;
  onUpdate: (value: Partial<MealDraft>) => void;
  onGo: (step: MealStep) => void;
  onBack: () => void;
  onPick: (source: PhotoSource) => void;
  onFullPhoto: () => void;
  onAnalyze: () => void;
  onCancelAnalysis: () => void;
  onEdit: (food?: FoodItem) => void;
  onRemove: (id: string) => void;
  onRemovePhoto: () => void;
  onChangeFood: (value: Partial<FoodItem>) => void;
  onSaveFood: () => void;
  onConfirm: () => void;
  onSave: (skip: boolean) => void;
  onAfterMeal: () => void;
  onHome: () => void;
  onSheet: (sheet: 'help' | 'privacy' | null) => void;
  onTraits: (value: FoodTraits | null) => void;
  onSaveTraits: () => void;
  onToggleTrait: (group: TraitGroup, value: string) => void;
  onRetryDraft: () => void;
  onLanguage: () => void;
};
