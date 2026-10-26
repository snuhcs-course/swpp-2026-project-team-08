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
  const { foods, review: _review, suggestion_links: _links, ...record } = meal;
  return {
    meal: { ...record, after_photo_uri: body.after_photo_uri },
    food_results: body.food_results.map(result => {
      const { id: _id, meal_id: _mealId, ...snapshot } = foods.find(food => food.id === result.food_id);
      return { meal_id: meal.id, food_id: result.food_id, food_snapshot: snapshot,
        outcome: result.outcome, difficulties: result.difficulties };
    }),
    ingredient_results: body.food_results.flatMap(food => (food.ingredient_outcomes ?? []).map(item => ({
      meal_id: meal.id, food_id: food.food_id, ingredient_id: item.ingredient_id,
      outcome: item.outcome, difficulties: item.difficulties,
    }))),
  };
}
module.exports = { mealResponse, reviewResponse };
