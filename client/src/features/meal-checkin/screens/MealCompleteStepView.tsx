// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Grok 4.7, 2026-11-14, reviewed by Doyeon Kim
// Changed: 식전 저장 완료 화면의 식사 카드와 다음 단계

import { MealFlowButton } from '../../../components/MealFlowButton';
import { MealTextButton } from '../../../components/MealTextButton';
import { MealSavedPanel } from '../../../components/MealSavedPanel';
import { displayDate } from '../../../util/date';
import { abcCopyFor, copyFor } from '../../../util/strings';
import type { MealCheckinViewProps } from './mealCheckinViewTypes';
type Props = Pick<MealCheckinViewProps, 'draft' | 'language' | 'onAfterMeal' | 'onHome'>;
export function MealCompleteStepView({ p }: { p: Props }) {
  const d = p.draft;
  const m = copyFor(p.language).mealCheckin;
  const a = abcCopyFor(p.language);
  return <MealSavedPanel title={m.titles.complete} message={m.done}
    photos={d.photo ? [{ uri: d.photo.uri, label: m.beforeMealBadge }] : []}
    mealTypeLabel={d.mealType ? m.types[d.mealType] : ''}
    date={displayDate(d.mealDate, p.language)}
    foodNames={d.foods.map((food) => food.name)}
    steps={[
      { label: a.checkInStep, state: a.stepSaved, done: true },
      { label: a.afterMealStep, state: a.stepAwaiting, done: false },
    ]}
    actions={<>
      <MealFlowButton label={m.afterMeal} icon={null} disabled={!d.savedMealId} onPress={p.onAfterMeal} labelStyle={{ fontSize: 16 }} />
      <MealTextButton label={m.backToHome} onPress={p.onHome} />
    </>} />;
}
