# AI-generated with GPT-6, 2026-11-04, reviewed by Haechan Jung
# Changed: 최신 API 요청의 공통 fixture 정리


def review_payload(*, food_id: str, outcome: str = "EATEN") -> dict:
    """서버가 발급한 음식 ID로 최신 리뷰 요청을 만든다."""
    return {
        "after_photo_uri": "after.jpg",
        "food_results": [
            {
                "food_id": food_id,
                "outcome": outcome,
                "difficulty_reasons": ["TEXTURE.HARDNESS.SOFT"],
                "ingredient_outcomes": [],
            }
        ],
    }
