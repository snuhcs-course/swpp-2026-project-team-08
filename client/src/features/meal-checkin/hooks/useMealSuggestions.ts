// AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
// AI-generated with GPT-6, 2026-10-18, reviewed by Haechan Jung; carry actual source meal date into suggestion cards
// Changed: 화면 디자인 및 식사 흐름 개선
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천으로 바뀌어 근거 음식 이름을 원본 식사에서 찾음
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 체크인에서 저장 추천의 음식명 표시
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 저장 추천을 음식 이름·이유·준비 방법으로 표시하고 원본 식사 조회 제거

import {
  useMealsForCheckin,
  useSavedSuggestionsForCheckin,
} from '../../../data/queries/checkinReferenceQueries';

export function useMealSuggestions(userId: string) {
  const query = useSavedSuggestionsForCheckin(userId);
  const meals = useMealsForCheckin(userId);
  return {
    // 홈 추천은 원본 식사가 없으므로 식사 날짜·끼니는 싣지 않는다.
    suggestions: (query.data ?? []).map((item) => ({
      id: item.id,
      title: item.whatToTry,
      description: item.whyThisMayHelp,
      servingTip: item.preparationMethod ?? undefined,
    })),
    loading: query.isPending,
    error: query.isError,
    retry: () => { void query.refetch(); void meals.refetch(); },
  };
}
