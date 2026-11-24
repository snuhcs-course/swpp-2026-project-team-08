// AI-generated with GPT-6, 2026-11-22, reviewed by Haechan Jung
// Changed: 추천 생성·재생성 Integration의 서버 식사와 추천 응답 준비 공유
const { mealResponse, reviewResponse } = require('./server-meal.cjs');
const { suggestionResponse } = require('./server-suggestion.cjs');

function mealWithFoods(count, reviewed = true) {
  const meal = mealResponse();
  meal.foods = Array.from({ length: count }, (_, index) => ({
    ...mealResponse().foods[0],
    id: String(index + 1),
    name: `Food ${index + 1}`,
    ingredients: [
      {
        id: String(101 + index),
        name: "Carrot",
        outcome: null,
        difficulty_reasons: [],
      },
    ],
  }));
  if (!count || !reviewed) return meal;
  return reviewResponse(meal, {
    after_photo_uri: null,
    food_results: meal.foods.map((food) => ({
      food_id: food.id,
      outcome: "TASTED",
      difficulty_reasons: [],
      ingredient_outcomes: [
        {
          ingredient_id: food.ingredients[0].id,
          outcome: "UNTOUCHED",
          difficulty_reasons: [],
        },
      ],
    })),
  });
}

function card(meal, foodId, id, status = "PENDING") {
  return suggestionResponse({
    id,
    meal_id: meal.id,
    origin_food_id: foodId,
    status,
    saved_at: status === "SAVED" ? "2026-11-02T00:00:00Z" : null,
    created_at: "2026-11-02T00:00:00Z",
  });
}

module.exports = { mealWithFoods, card };
