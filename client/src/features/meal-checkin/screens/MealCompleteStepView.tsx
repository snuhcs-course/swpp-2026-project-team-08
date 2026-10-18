// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; match saved check-in layout
// This Code is generated with AI
import { AppButton } from '../../../components/AppButton';
import { MealSavedPanel } from '../../../components/MealSavedPanel';
import { displayDate } from '../../../util/date';
import { copyFor } from '../../../util/strings';
import { colors } from '../../../util/colors';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';
type Props = Pick<MealCheckinViewProps, 'draft' | 'language' | 'onAfterMeal' | 'onHome'>;
export function MealCompleteStepView({ p }: { p: Props }) {
  const d = p.draft; const m = copyFor(p.language).mealCheckin;
  return <MealSavedPanel title={m.titles.complete} message={m.done} badge={m.awaitingReview}
    photos={d.photo ? [d.photo.uri] : []} date={`${d.mealType ? m.types[d.mealType] : ''}, ${displayDate(d.mealDate, p.language)}`}
    foodNames={d.foods.map((food) => food.name).join(', ')} actions={<>
      <AppButton variant="meal" label={m.afterMeal} disabled={!d.savedMealId} onPress={p.onAfterMeal} style={{ minHeight: 48 }} labelStyle={{ fontSize: 16 }} />
      <AppButton variant="meal" secondary label={m.backToHome} onPress={p.onHome} style={{ minHeight: 48 }} labelStyle={{ fontSize: 16, color: colors.homePrimary }} />
    </>} />;
}
