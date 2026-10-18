// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; remove non-Figma suggestion confirmation step
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; match review saved panel
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; modified existing code
// This Code is generated with AI

import { MealSavedPanel } from '../../../components/MealSavedPanel';
import { displayDate } from '../../../util/date';
import { AppButton } from '../../../components/AppButton';
import { colors } from '../../../util/colors';
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
      <AppButton variant="meal" label={a.viewMealSuggestions} onPress={p.onRecommend} style={{ minHeight: 48 }} labelStyle={{ fontSize: 16 }} />
      <AppButton variant="meal" secondary label={a.returnHome} onPress={p.onHome} style={{ minHeight: 48, borderWidth: 0, backgroundColor: colors.transparent }} labelStyle={{ fontSize: 16, color: colors.homePrimary }} />
    </>} />;
}
