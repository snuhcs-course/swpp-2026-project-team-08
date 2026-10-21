"""Public suggestion requests and responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.features.meals.dto import FoodSnapshot

BigintId = str
DismissReason = Literal[
    "restriction_conflict",
    "disliked_food_or_form",
    "food_preferences",
    "too_much_preparation",
    "ingredient_unavailable",
    "already_tried",
]


class SuggestionResponse(BaseModel):
    id: BigintId
    user_id: BigintId
    meal_id: BigintId
    food_id: BigintId
    ingredient_id: BigintId | None
    food_snapshot: FoodSnapshot
    what_to_try: str
    why_this_may_help: str
    serving_tip: str | None
    status: Literal["pending", "saved", "dismissed"]
    dismiss_reasons: list[DismissReason]
    saved_at: datetime | None
    created_at: datetime


class SuggestionTarget(BaseModel):
    model_config = ConfigDict(extra="forbid")

    food_id: str = Field(max_length=19, pattern=r"^[1-9][0-9]*$")
    ingredient_id: str | None = Field(default=None, max_length=19, pattern=r"^[1-9][0-9]*$")

    @model_validator(mode="after")
    def check_bigint(self) -> "SuggestionTarget":
        if int(self.food_id) > 2**63 - 1 or (
            self.ingredient_id is not None and int(self.ingredient_id) > 2**63 - 1
        ):
            raise ValueError("id exceeds BIGINT")
        return self


class SuggestionGenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    targets: list[SuggestionTarget] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_targets(self) -> "SuggestionGenerateRequest":
        keys = [
            (int(item.food_id), int(item.ingredient_id) if item.ingredient_id else None)
            for item in self.targets
        ]
        if len(keys) != len(set(keys)):
            raise ValueError("targets must be unique")
        return self


class SuggestionDecisionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["saved", "dismissed"]
    dismiss_reasons: list[DismissReason] = Field(default_factory=list)

    @model_validator(mode="after")
    def valid_reasons(self) -> "SuggestionDecisionRequest":
        if self.status == "saved" and self.dismiss_reasons:
            raise ValueError("saved suggestions cannot have dismiss reasons")
        if self.status == "dismissed" and not self.dismiss_reasons:
            raise ValueError("dismissed suggestions need a reason")
        if len(self.dismiss_reasons) != len(set(self.dismiss_reasons)):
            raise ValueError("dismiss reasons must be unique")
        return self
