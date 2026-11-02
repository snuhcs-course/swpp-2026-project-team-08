// AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
// Changed: Meal outcome slider with existing saved outcome values

import { AcceptanceSlider } from '../../../components/AcceptanceSlider';
import type { Outcome } from '../../../types/afterMealReview';

const values: readonly Outcome[] = ['untouched', 'tasted', 'eaten'];

export function MealOutcomeSlider({ value, label, labels, unsetLabel, onSelect }: {
  value: Outcome | null;
  label: string;
  labels: Record<Outcome, string>;
  unsetLabel: string;
  onSelect: (value: Outcome) => void;
}) {
  return <AcceptanceSlider review clearable={false}
    value={value == null || value === 'unclear' ? null : values.indexOf(value)} label={label}
    options={[labels.untouched, labels.tasted, labels.eaten]}
    unsetLabel={unsetLabel} onChange={(index) => { if (index != null) onSelect(values[index]); }} />;
}
