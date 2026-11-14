// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 식후 검토 글자 확대 및 완료 버튼 디자인 통일
// AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
// Changed: Eaten 대상의 어려움·추천 제외 및 빈 단계 건너뛰기
// AI-generated with Grok 4.7, 2026-11-14, reviewed by Doyeon Kim
// Changed: 식후 저장 완료 화면의 식사 카드와 단계 표시

import { MealSavedPanel } from '../../../components/MealSavedPanel';
import { displayDate } from '../../../util/date';
import { MealFlowButton } from '../../../components/MealFlowButton';
import { MealTextButton } from '../../../components/MealTextButton';
import { abcCopyFor, copyFor } from '../../../util/strings';
import type { ReviewViewProps } from './reviewViewTypes';

type Props = Pick<ReviewViewProps, 'meal' | 'draft' | 'language' | 'onRecommend'> & { onHome: () => void };

export function AfterMealFollowUpView({ p }: { p: Props }) {
  const s = copyFor(p.language);
  const m = s.afterMealReview;
  const a = abcCopyFor(p.language);
  const photos = [
    p.meal.photo ? { uri: p.meal.photo.uri, label: s.mealCheckin.beforeMealBadge } : null,
    p.draft.afterPhoto ? { uri: p.draft.afterPhoto.uri, label: s.mealCheckin.afterMealBadge } : null,
  ].filter((photo): photo is { uri: string; label: string } => photo !== null);
  return <MealSavedPanel title={a.reviewSavedTitle} message={m.saved}
    photos={photos}
    mealTypeLabel={s.mealCheckin.types[p.meal.mealType]}
    date={displayDate(p.meal.mealDate, p.language)}
    foodNames={p.meal.foods.map((food) => food.name)}
    steps={[
      { label: a.checkInStep, state: a.stepSaved, done: true },
      { label: a.afterMealStep, state: a.stepSaved, done: true },
    ]}
    actions={<>
      {p.draft.outcomes.some(food => food.decision.confirmed && food.decision.confirmed !== 'eaten') &&
        <MealFlowButton label={a.viewMealSuggestions} icon={null} onPress={p.onRecommend} />}
      <MealTextButton label={a.returnHome} onPress={p.onHome} />
    </>} />;
}
