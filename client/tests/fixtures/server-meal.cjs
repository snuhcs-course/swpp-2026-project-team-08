// AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
function mealResponse() {
  return {
    id: '10', user_id: '1', meal_date: '2026-10-23', meal_type: 'lunch', setting: 'home',
    before_photo_uri: null, after_photo_uri: null, saved_at: '2026-10-23T00:00:00Z',
    foods: [{ id: '1', meal_id: '10', name: 'Rice', ingredients: [],
      cooking_method: null, serving_note: null, acceptance: null }],
    review: null, suggestion_links: [],
  };
}
function reviewResponse(meal, body) {
  return {
    meal: { ...meal, after_photo_uri: body.after_photo_uri },
    food_results: body.food_results.map(food => ({ meal_id: meal.id, food_id: food.food_id,
      food_snapshot: { name: 'Rice', ingredients: [], cooking_method: null, serving_note: null, acceptance: null },
      outcome: food.outcome, difficulties: food.difficulties })),
    ingredient_results: [],
  };
}
module.exports = { mealResponse, reviewResponse };
