// AI-generated with GPT-6, 2026-11-21, reviewed by Haechan Jung
// Changed: 식사 완료의 상세 입력·요청 기대값·서버 발급 ID 응답
const { linkingDraft, link } = require('./meal-suggestion-linking.cjs');
const { mealResponse } = require('./server-meal.cjs');

function completionDraft({ linked = false, empty = false } = {}) {
  return { ...linkingDraft(linked ? [link(0, 'rice')] : []),
    photo: null, foods: empty ? [] : linkingDraft().foods };
}
function expectedWrite({ linked = false, single = false } = {}) {
  const foods = [
    { name: 'Carrot rice', ingredients: [{ name: 'Rice' }, { name: 'Carrot' }],
      cooking_method: 'STEAMED', serving_note: 'Small bowl', acceptance: 2,
      food_recommendation_ids: linked ? ['31'] : [] },
    { name: 'Tofu soup', ingredients: [{ name: 'Tofu' }], cooking_method: 'BOILED',
      serving_note: 'Warm', acceptance: 0, food_recommendation_ids: [] },
  ];
  return { meal_date: '2026-11-16', meal_type: 'DINNER', setting: 'RESTAURANT',
    before_photo_uri: null, foods: single ? foods.slice(0, 1) : foods };
}
function completionResponse({ linked = false, single = false } = {}) {
  const base = mealResponse();
  const foods = [
    { ...base.foods[0], id: '901', meal_id: '900', name: 'Carrot rice',
      ingredients: [{ id: '911', name: 'Rice', outcome: null, difficulty_reasons: [] },
        { id: '912', name: 'Carrot', outcome: null, difficulty_reasons: [] }],
      cooking_method: 'STEAMED', serving_note: 'Small bowl', acceptance: 2,
      recommendation_tries: linked ? [{ id: '950', food_recommendation_id: '31', feedback: null,
        created_at: '2026-11-16T09:00:00Z', updated_at: '2026-11-16T09:00:00Z',
        recommendation: { what_to_try: 'Offer a small spoonful.',
          why_this_may_help: 'Familiar texture', serving_tip: 'Serve separately.' } }] : [] },
    { ...base.foods[0], id: '902', meal_id: '900', name: 'Tofu soup',
      ingredients: [{ id: '913', name: 'Tofu', outcome: null, difficulty_reasons: [] }],
      cooking_method: 'BOILED', serving_note: 'Warm', acceptance: 0 },
  ];
  return { ...base, id: '900', meal_date: '2026-11-16', meal_type: 'DINNER', setting: 'RESTAURANT',
    saved_at: '2026-11-16T09:00:00Z', foods: single ? foods.slice(0, 1) : foods };
}
module.exports = { completionDraft, expectedWrite, completionResponse };
