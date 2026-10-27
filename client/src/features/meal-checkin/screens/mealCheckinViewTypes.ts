<<<<<<< HEAD
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
import type { FoodItem, MealDraft, MealStep, PhotoSource } from '../../../types/meal';
import type { Language } from '../../../types/profile';
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
=======
// AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
// Changed: 추천 카드·저장된 추천 기능 추가
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
// Changed: 화면 디자인 및 식사 흐름 개선

import type { FoodItem, MealDraft, MealStep, PhotoSource } from '../../../types/meal';
import type { Language } from '../../../types/profile';
>>>>>>> a902dcbc5a996c2df4f204d9955a76945e895f03
import type { MealSuggestionLinking, MealSuggestionOption } from '../types';

type DateInput = {
  parts: [number, number, number];
  open: boolean;
  field: 0 | 1 | 2 | null;
  onToggle: () => void;
  onFieldChange: (field: 0 | 1 | 2 | null) => void;
  onNumberSelect: (number: number) => void;
  onDateChange: (date: Date) => void;
  onConfirm: (date?: Date) => void;
};

type FoodInput = {
  ingredient: string;
  canAddIngredient: boolean;
  onIngredientChange: (value: string) => void;
  onAddIngredient: () => boolean;
  onRemoveIngredient: (value: string) => void;
};

export type MealCheckinViewProps = {
  draft: MealDraft;
  childName: string;
  onConfirmFood: (id: string) => void;
  removedName?: string;
  onUndoRemove: () => void;
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
