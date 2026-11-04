# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: 최신 API 요청의 공통 fixture 정리


def food_payload(name: str = "감자볶음", *ingredients: str) -> dict:
    return {
        "name": name,
        "ingredients": [{"name": item} for item in (ingredients or ("감자",))],
        "cooking_method": "STIR_FRIED",
        "serving_note": "작게 잘라 제공",
        "acceptance": 1,
    }


def meal_payload(*foods: dict) -> dict:
    return {
        "meal_date": "2026-10-20",
        "meal_type": "LUNCH",
        "setting": "HOME",
        "before_photo_uri": None,
        "foods": list(foods or [food_payload()]),
    }
