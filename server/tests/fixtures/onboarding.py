# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with GPT-6, 2026-10-28, reviewed by Seoyeon Heo
# Changed: Align onboarding fixture with supported food preferences
"""Valid onboarding request; each call returns independent nested values."""


def request_body() -> dict:
    return {
        "profile": {
            "child_name": "아이",
            "age_group": "4-5",
            "safety": {
                "allergies": {
                    "status": "specified",
                    "items": [{"code": "egg", "custom_name": None}],
                },
                "restrictions": {"status": "none", "items": []},
            },
            "food_preferences": {
                "family_foods": [{"code": "eggs", "custom_name": None}],
            },
            "safe_foods": {
                "status": "listed",
                "items": [
                    {
                        "name": "감자",
                        "preparation": "푹 삶기",
                        "presentation_note": "작게 잘라 제공",
                    }
                ],
            },
        },
        "consents": [
            {"kind": "account_privacy", "granted": True},
            {"kind": "photo_analysis", "granted": True},
            {"kind": "ai_training", "granted": False},
        ],
    }
