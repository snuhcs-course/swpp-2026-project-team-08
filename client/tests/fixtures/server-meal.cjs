// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
// AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
// Changed: 음식·재료 안 리뷰 결과와 대문자 enum 을 쓰는 서버 응답 모양으로 변경
function mealResponse() {
  return {
    id: '10', user_id: '1', meal_date: '2026-10-23', meal_type: 'LUNCH', setting: 'HOME',
    before_photo_uri: null, after_photo_uri: null, saved_at: '2026-10-23T00:00:00Z',
    foods: [{ id: '1', meal_id: '10', name: 'Rice', ingredients: [],
      cooking_method: null, serving_note: null, acceptance: null,
      outcome: null, difficulty_reasons: [], recommendation_tries: [] }],
  };
}
// 서버처럼 리뷰 요청의 결과를 음식·재료 안에 적용한 식사 상세를 돌려준다.
function reviewResponse(meal, body) {
  return {
    ...meal,
    after_photo_uri: body.after_photo_uri,
    foods: meal.foods.map(food => {
      const result = body.food_results.find(item => item.food_id === food.id);
      const reviewed = new Map((result.ingredient_outcomes ?? []).map(item => [item.ingredient_id, item]));
      return {
        ...food,
        outcome: result.outcome,
        difficulty_reasons: result.difficulty_reasons,
        ingredients: food.ingredients.map(ingredient => ({
          ...ingredient,
          outcome: reviewed.get(ingredient.id)?.outcome ?? null,
          difficulty_reasons: reviewed.get(ingredient.id)?.difficulty_reasons ?? [],
        })),
      };
    }),
  };
}
module.exports = { mealResponse, reviewResponse };
