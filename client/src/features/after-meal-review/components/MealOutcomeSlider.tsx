// AI-generated with GPT-6, 2026-11-03, reviewed by Seoyeon Heo
// Changed: Use shared slider values with unclear first

import { AcceptanceSlider } from '../../../components/AcceptanceSlider';
import type { Outcome } from '../../../types/afterMealReview';

const values = ['unclear', 'untouched', 'tasted', 'eaten'] as const satisfies readonly Outcome[];

export function MealOutcomeSlider({ value, label, labels, unsetLabel, onSelect }: {
  value: Outcome | null;
  label: string;
  labels: Record<Outcome, string>;
  unsetLabel: string;
  onSelect: (value: Outcome) => void;
}) {
  return <AcceptanceSlider<Outcome> review clearable={false} value={value} label={label}
    options={values.map(outcome => labels[outcome])} optionValues={values}
    unsetLabel={unsetLabel} onChange={(outcome) => { if (outcome != null) onSelect(outcome); }} />;
}
