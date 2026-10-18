# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
"""Replace only this async function when the real recommendation generator is ready."""

import asyncio


async def generate_suggestions(foods: list[dict]) -> list[dict]:
    await asyncio.sleep(1)
    return [
        {
            "food_id": food["id"],
            "what_to_try": f"Offer a small, separate portion of {food['name']}.",
            "why_this_may_help": (
                "A familiar presentation gives your child time to explore at their own pace."
            ),
            "serving_tip": (
                "Use the ingredients and preparation you already checked. "
                "Let your child decide whether to taste."
            ),
        }
        for food in foods
    ]
