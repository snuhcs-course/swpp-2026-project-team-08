# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 리뷰 결과를 음식·재료 응답 안으로 옮기고 추천 시도 응답 추가

"""저장된 식사 기록을 공개 응답 모양으로 바꾼다."""

from app.features.meals.dto import (
    IngredientResponse,
    LinkedRecommendationResponse,
    MealDetailResponse,
    MealFoodResponse,
    RecommendationTryResponse,
)
from app.features.meals.queries import FoodRecords, MealRecords


def _food_response(item: FoodRecords) -> MealFoodResponse:
    food = item.food
    return MealFoodResponse(
        id=str(food.id),
        meal_id=str(food.meal_id),
        name=food.name,
        cooking_method=food.cooking_method,
        serving_note=food.serving_note,
        acceptance=food.acceptance,
        outcome=food.outcome,
        difficulty_reasons=food.difficulty_reasons,
        ingredients=[
            IngredientResponse(
                id=str(ingredient.id),
                name=ingredient.name,
                outcome=ingredient.outcome,
                difficulty_reasons=ingredient.difficulty_reasons,
            )
            for ingredient in item.ingredients
        ],
        recommendation_tries=[
            RecommendationTryResponse(
                id=str(attempt.id),
                food_recommendation_id=str(attempt.food_recommendation_id),
                feedback=attempt.feedback,
                created_at=attempt.created_at,
                updated_at=attempt.updated_at,
                recommendation=LinkedRecommendationResponse(
                    what_to_try=recommendation.what_to_try,
                    why_this_may_help=recommendation.why_this_may_help,
                    serving_tip=recommendation.serving_tip,
                ),
            )
            for attempt, recommendation in item.tries
        ],
    )


def meal_detail_response(records: MealRecords) -> MealDetailResponse:
    meal = records.meal
    return MealDetailResponse(
        id=str(meal.id),
        user_id=str(meal.user_id),
        meal_date=meal.meal_date,
        meal_type=meal.meal_type,
        setting=meal.setting,
        before_photo_uri=meal.before_photo_uri,
        after_photo_uri=meal.after_photo_uri,
        saved_at=meal.saved_at,
        foods=[_food_response(item) for item in records.foods],
    )
