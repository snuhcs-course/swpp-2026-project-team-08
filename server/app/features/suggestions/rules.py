# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
"""Stable revisions and target identities, shared with the HTTP boundary."""

import hashlib
import json
from datetime import UTC, datetime
from zoneinfo import ZoneInfo


def revision_for(meal) -> str:
    content = {
        "foods": [
            {
                "id": f.id,
                "name": f.name,
                "ingredients": f.ingredients,
                "preparation": f.preparation,
                "traits": f.traits,
                "serving_note": f.serving_note,
            }
            for f in meal.foods
        ],
        "review": None
        if not meal.review
        else {
            "outcomes": meal.review.outcomes,
            "difficulties": meal.review.difficulties,
            "saved_at": meal.review.saved_at.isoformat(),
        },
    }
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        value = value.replace(tzinfo=ZoneInfo("Asia/Seoul"))
    return value.astimezone(UTC)


def targets_for(meal) -> list[dict]:
    targets = []
    for food in meal.foods:
        targets.append({"id": f"food:{food.id}", "name": food.name, "food_id": food.id})
        outcome = next(
            (
                o
                for o in (meal.review.outcomes if meal.review else [])
                if o.get("food_id") == food.id
            ),
            {},
        )
        for ingredient in outcome.get("ingredients", []):
            # Only tracked ingredients are eligible; IDs are scoped to their parent food.
            targets.append(
                {
                    "id": f"ingredient:{food.id}:{ingredient['id']}",
                    "name": ingredient["name"],
                    "food_id": food.id,
                }
            )
    return targets
