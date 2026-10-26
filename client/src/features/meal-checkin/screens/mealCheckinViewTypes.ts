// AI-generated with GPT-6, 2026-10-26, reviewed by Seoyeon Heo
import type { FoodItem, MealDraft, MealStep, PhotoSource } from '../../../types/meal';
import type { Language } from '../../../types/profile';
// AI-generated with GPT-6, 2026-10-26, reviewed by Seoyeon Heo
import type { IngredientInputStatus, MealSuggestionLinking, MealSuggestionOption } from '../types';

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
  ingredientStatus: IngredientInputStatus;
  ingredientChoices: string[];
  canAddIngredient: boolean;
  onIngredientChange: (value: string) => void;
  onAddIngredient: () => boolean;
  onSelectIngredient: (name: string) => boolean;
  onRemoveIngredient: (value: string) => void;
};

export type MealCheckinViewProps = {
  draft: MealDraft;
  childName: string;
  onConfirmFood: (id: string) => void;
  removedName?: string;
  onUndoRemove: () => void;
  // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
  suggestions: MealSuggestionOption[];
  onRetryIngredients: () => void;
  suggestionLinking: MealSuggestionLinking;
  suggestionsLoading: boolean;
  suggestionsError: boolean;
  onRetrySuggestions: () => void;
  tryingSuggestion?: { checked: boolean; onToggle: () => void };
  language: Language;
  saveStatus: 'saving' | 'saved' | 'error';
  error: 'permission' | 'image' | 'save' | null;
  picking: boolean;
  saving: boolean;
  sheet: 'privacy' | null;
  languageError: boolean;
  dateInput: DateInput;
  foodInput: FoodInput;
  onUpdate: (value: Partial<MealDraft>) => void;
  onGo: (step: MealStep) => void;
  onBack: () => void;
  onSaveExit: () => void;
  onPick: (source: PhotoSource) => void;
  onFullPhoto: () => void;
  onEdit: (food?: FoodItem) => void;
  onRemove: (id: string) => void;
  onRemovePhoto: () => void;
  onChangeFood: (value: Partial<FoodItem>) => void;
  onSaveFood: () => void;
  onConfirm: () => void;
  onAfterMeal: () => void;
  onHome: () => void;
  onSheet: (sheet: 'privacy' | null) => void;
  onRetryDraft: () => void;
  onLanguage: () => void;
};
