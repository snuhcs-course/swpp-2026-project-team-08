// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; restore separate saved-suggestion record linking
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; expose source meal metadata
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; removed photo analysis flow
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung

import type { FoodItem, FoodTraits, MealDraft, MealStep, PhotoSource, TraitGroup } from '../../../types/meal';
import type { Language } from '../../../types/profile';
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
import type { MealSuggestionLinking, MealSuggestionOption } from '../types';

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
  childName: string;
  onConfirmFood: (id: string) => void;
  removedName?: string;
  onUndoRemove: () => void;
  // AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
  suggestions: MealSuggestionOption[];
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
  traits: FoodTraits | null;
  sheet: 'help' | 'privacy' | null;
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
