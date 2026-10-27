// This Code is generated with AI
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// Changed: 식후 검토 글자 확대 및 완료 버튼 디자인 통일

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
  return <MealSavedPanel title={a.reviewSavedTitle} message={m.saved}
    photos={[p.meal.photo?.uri, p.draft.afterPhoto?.uri].filter((uri): uri is string => !!uri)}
    date={`${s.mealCheckin.types[p.meal.mealType]}, ${displayDate(p.meal.mealDate, p.language)}`}
    foodNames={p.meal.foods.map((food) => food.name).join(', ')}
    actions={<>
      <MealFlowButton label={a.viewMealSuggestions} onPress={p.onRecommend} />
      <MealTextButton label={a.returnHome} onPress={p.onHome} />
    </>} />;
}
