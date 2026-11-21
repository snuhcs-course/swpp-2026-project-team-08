// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 음식별 추천 연결과 원본 추천·식사 조회 입력
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
    suggestions: options.map((option, i) => suggestionResponse({ id: option.id,
      origin_food_id: String(101 + i), meal_id: String(81 + i), what_to_try: option.description,
      serving_tip: option.servingTip, status: 'SAVED', saved_at: '2026-10-21T00:00:00Z' })),
    meals: options.map((option, i) => {
      const meal = mealResponse();
      return { ...meal, id: String(81 + i), meal_date: option.mealDate,
        meal_type: option.mealType.toUpperCase(), foods: [{ ...meal.foods[0],
          id: String(101 + i), meal_id: String(81 + i), name: option.title }] };
    }),
  };
}
module.exports = { options, link, linkingDraft, sourceResponses };
