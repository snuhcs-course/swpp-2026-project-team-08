# AI-generated with GPT-6, 2026-11-02, reviewed by Haechan Jung
# Changed: 공통 식사·리뷰 요청 데이터 factory 작성


def review_payload(
    *,
    food_id: str = "1",
    ingredient_id: str | None = None,
    outcome: str | None = None,
) -> dict:
    """음식 한 개와 선택한 재료의 식후 결과 요청 본문을 새로 만든다."""
    return {
        "after_photo_uri": "after.jpg",
        "food_results": [
            {
                "food_id": food_id,
                "outcome": outcome,
                "difficulties": [],
                "ingredient_outcomes": []
                if ingredient_id is None
                else [
                    {
                        "ingredient_id": ingredient_id,
                        "outcome": "tasted",
                        "difficulties": [],
                    }
                ],
            }
        ],
    }
