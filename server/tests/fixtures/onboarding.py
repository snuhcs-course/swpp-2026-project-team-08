# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with GPT-6, 2026-10-28, reviewed by Seoyeon Heo
# Changed: Align onboarding fixture with supported food preferences
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 온보딩 요청을 restrictions 목록과 대문자 enum 값으로 변경
# AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
# Changed: 요청에 dietary_pattern 추가
"""Valid onboarding request; each call returns independent nested values."""


def request_body() -> dict:
    return {
        "profile": {
            "child_name": "아이",
            "age_group": "AGE_4_5",
            "restrictions": ["ALLERGY.EGGS", "VEGETARIAN.DAIRY"],
            "dietary_pattern": None,
            "safe_foods": [
                {
                    "name": "감자",
                    "preparation": "푹 삶기",
                    "presentation_note": "작게 잘라 제공",
                },
                {"name": "쌀밥", "preparation": "질게 짓기", "presentation_note": None},
            ],
        },
        "consents": [
            {"kind": "ACCOUNT_PRIVACY", "granted": True},
            {"kind": "PHOTO_ANALYSIS", "granted": True},
            {"kind": "AI_TRAINING", "granted": False},
        ],
    }
