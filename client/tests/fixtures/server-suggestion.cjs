// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식 단위 추천 서버 응답 픽스처 추가
function suggestionResponse(overrides = {}) {
  return {
    id: '31', user_id: '1', origin_food_id: '2', meal_id: '8',
    what_to_try: 'Try a little', why_this_may_help: 'Familiar texture', serving_tip: null,
    ingredients: ['Potato'], cooking_method: 'STEAMED', causes: 'The soft texture was hard.',
    status: 'PENDING', dismiss_reasons: [], saved_at: null, created_at: '2026-10-21T00:00:00Z',
    ...overrides,
  };
}
module.exports = { suggestionResponse };
