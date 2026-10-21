"""Convert stored meal records to the public response schema."""

from app.features.meals.dto import (
    FoodItemDetailResponse,
    IngredientResponse,
    LinkedSuggestionResponse,
    MealDetailResponse,
    MealReviewResponse,
    MealWriteResponse,
    ReviewFoodResultResponse,
    ReviewIngredientResultResponse,
    ReviewResponse,
    SuggestionMealLinkResponse,
)
from app.features.meals.queries import MealRecords
from app.models.meal import Meal


def meal_response(meal: Meal) -> MealWriteResponse:
    return MealWriteResponse(
        id=str(meal.id),
        user_id=str(meal.user_id),
        meal_date=meal.meal_date,
        meal_type=meal.meal_type,
        setting=meal.setting,
        before_photo_uri=meal.before_photo_uri,
        after_photo_uri=meal.after_photo_uri,
        saved_at=meal.saved_at,
    )


def review_response(records: MealRecords) -> ReviewResponse:
    return ReviewResponse(
        food_results=[
            ReviewFoodResultResponse(
                meal_id=str(item.meal_id),
                food_id=str(item.food_id),
                food_snapshot=item.food_snapshot,
                outcome=item.outcome,
                difficulties=item.difficulties,
            )
            for item in records.food_results
        ],
        ingredient_results=[
            ReviewIngredientResultResponse(
                meal_id=str(item.meal_id),
                food_id=str(item.food_id),
                ingredient_id=str(item.ingredient_id),
                outcome=item.outcome,
                difficulties=item.difficulties,
            )
            for item in records.ingredient_results
        ],
    )


def meal_review_response(records: MealRecords) -> MealReviewResponse:
    return MealReviewResponse(
        meal=meal_response(records.meal), **review_response(records).model_dump()
    )


def meal_detail_response(records: MealRecords) -> MealDetailResponse:
    ingredients_by_food: dict[int, list[IngredientResponse]] = {
        food.id: [] for food in records.foods
    }
    for link, ingredient in records.ingredients:
        ingredients_by_food[link.food_id].append(
            IngredientResponse(id=str(ingredient.id), name=ingredient.name)
        )
    meal_data = meal_response(records.meal).model_dump()
    return MealDetailResponse(
        **meal_data,
        foods=[
            FoodItemDetailResponse(
                id=str(food.id),
                meal_id=str(food.meal_id),
                name=food.name,
                cooking_method=food.cooking_method,
                serving_note=food.serving_note,
                acceptance=food.acceptance,
                ingredients=ingredients_by_food[food.id],
            )
            for food in records.foods
        ],
        review=review_response(records) if records.food_results else None,
        suggestion_links=[
            SuggestionMealLinkResponse(
                id=str(link.id),
                suggestion_id=str(link.suggestion_id),
                meal_id=str(link.meal_id),
                food_id=str(link.food_id),
                ingredient_id=str(link.ingredient_id) if link.ingredient_id is not None else None,
                feedback=link.feedback,
                created_at=link.created_at,
                updated_at=link.updated_at,
                suggestion=LinkedSuggestionResponse(
                    what_to_try=suggestion.what_to_try,
                    why_this_may_help=suggestion.why_this_may_help,
                    serving_tip=suggestion.serving_tip,
                ),
            )
            for link, suggestion in records.links
        ],
    )
