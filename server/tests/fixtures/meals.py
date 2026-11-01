# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: 공통 식사·리뷰 요청 데이터 factory 작성


def food_payload(
    ingredient_id: str | None = None,
    ingredient_name: str = "감자",
    *,
    food_id: str = "1",
) -> dict:
    """정상 음식 한 개의 요청 데이터를 새로 만든다."""
    return {
        "id": food_id,
        "name": "감자볶음",
        "ingredients": [{"id": ingredient_id, "name": ingredient_name}],
        "cooking_method": "stir_fried",
        "serving_note": "작게 잘라 제공",
        "acceptance": 1,
    }


def meal_payload(ingredient_id: str | None = None, ingredient_name: str = "감자") -> dict:
    """음식 한 개를 포함한 정상 식사 요청 본문을 새로 만든다."""
    return {
        "meal_date": "2026-10-20",
        "meal_type": "lunch",
        "setting": "home",
        "before_photo_uri": None,
        "foods": [food_payload(ingredient_id, ingredient_name)],
        "suggestion_links": [],
    }
