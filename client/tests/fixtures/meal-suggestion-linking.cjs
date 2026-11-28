// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 음식별 추천 연결과 원본 추천·식사 조회 입력
// AI-generated with GPT-6, 2026-11-26, reviewed by Haechan Jung
// Changed: 체크인 선택지에 저장된 추천 음식명 제공
// AI-generated with Claude Opus 5.5, 2026-11-28, reviewed by Jaemin Kim
// Changed: 저장 추천 응답을 음식 이름·이유·준비 방법 필드로 변경
const { photoDraft } = require('./meal-photo.cjs');
const { mealResponse } = require('./server-meal.cjs');
const { suggestionResponse } = require('./server-suggestion.cjs');

const options = [
  { id: '31', title: 'Potato mash', description: 'Offer a small spoonful.',
    servingTip: 'Serve separately.', mealDate: '2026-10-11', mealType: 'lunch' },
  { id: '32', title: 'Soft carrot', description: 'Try a soft strip.',
    servingTip: 'Keep it warm.', mealDate: '2026-10-12', mealType: 'dinner' },
];
function link(index, foodId) {
  const { id, title, description, servingTip } = options[index];
  return { suggestionId: id, foodId, title, description, servingTip };
}
function linkingDraft(links = []) {
  return { ...photoDraft(), step: 'foods', suggestionLinks: links };
}
function sourceResponses() {
  return {
    // 체크인 선택지의 제목·설명·준비 팁은 저장 추천의 음식 이름·이유·준비 방법이다.
    suggestions: options.map((option) => suggestionResponse({ id: option.id, what_to_try: option.title,
      why_this_may_help: option.description, preparation_method: option.servingTip,
      status: 'SAVED', saved_at: '2026-10-21T00:00:00Z' })),
    meals: options.map((option, i) => {
      const meal = mealResponse();
      return { ...meal, id: String(81 + i), meal_date: option.mealDate,
        meal_type: option.mealType.toUpperCase(), foods: [{ ...meal.foods[0],
          id: String(101 + i), meal_id: String(81 + i), name: option.title }] };
    }),
  };
}
module.exports = { options, link, linkingDraft, sourceResponses };
