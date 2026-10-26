"""Onboarding request and response shapes."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, StrictBool, field_validator, model_validator

AgeGroup = Literal["under-2", "2-3", "4-5", "6-8", "9-12", "13-plus"]
ConsentKind = Literal["account_privacy", "photo_analysis", "ai_training"]


class StrictDto(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProfileChoiceDto(StrictDto):
    code: str | None
    custom_name: str | None

    @model_validator(mode="after")
    def one_value(self) -> "ProfileChoiceDto":
        if (self.code is None) == (self.custom_name is None):
            raise ValueError("Exactly one of code or custom_name is required")
        if self.code is not None and (not self.code.strip() or self.code == "none"):
            raise ValueError("code must be a selected option")
        if self.custom_name is not None and not self.custom_name.strip():
            raise ValueError("custom_name must not be blank")
        return self


class SafetyChoiceDto(StrictDto):
    status: Literal["unknown", "none_known", "specified"]
    items: list[ProfileChoiceDto]

    @model_validator(mode="after")
    def consistent_items(self) -> "SafetyChoiceDto":
        if (self.status == "specified") != bool(self.items):
            raise ValueError("items must match status")
        return self


class RestrictionChoiceDto(StrictDto):
    status: Literal["none", "specified"]
    items: list[ProfileChoiceDto]

    @model_validator(mode="after")
    def consistent_items(self) -> "RestrictionChoiceDto":
        if (self.status == "specified") != bool(self.items):
            raise ValueError("items must match status")
        return self


class SafetyDto(StrictDto):
    allergies: SafetyChoiceDto
    restrictions: RestrictionChoiceDto


class FoodPreferencesDto(StrictDto):
    family_foods: list[ProfileChoiceDto] = Field(min_length=1)
    difficult_textures: list[ProfileChoiceDto]
    smell_sensitivity: Literal["yes", "sometimes", "no", "unsure"] | None
    difficult_tastes: list[ProfileChoiceDto]
    presentation_preferences: list[ProfileChoiceDto]
    preferred_temperature: Literal["none", "warm", "cool", "room", "depends"] | None
    new_food_response: Literal["tastes", "plate", "nearby", "removed", "varies", "unsure"] | None


class SafeFoodWriteDto(StrictDto):
    id: str | None = None
    name: str
    preparation: str
    presentation_note: str | None

    @field_validator("id")
    @classmethod
    def valid_id(cls, value: str | None) -> str | None:
        if value is not None and (
            not value.isascii()
            or not value.isdecimal()
            or value.startswith("0")
            or int(value) > 2**63 - 1
        ):
            raise ValueError("id must be a positive BIGINT string")
        return value

    @field_validator("name", "preparation")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("value must not be blank")
        return value


class SafeFoodsWriteDto(StrictDto):
    status: Literal["none", "listed"]
    items: list[SafeFoodWriteDto]

    @model_validator(mode="after")
    def consistent_items(self) -> "SafeFoodsWriteDto":
        if (self.status == "listed") != bool(self.items):
            raise ValueError("items must match status")
        ids = [item.id for item in self.items if item.id is not None]
        if len(ids) != len(set(ids)):
            raise ValueError("safe food IDs must be unique")
        return self


class ProfileWriteDto(StrictDto):
    child_name: str
    age_group: AgeGroup
    safety: SafetyDto
    food_preferences: FoodPreferencesDto
    safe_foods: SafeFoodsWriteDto

    @field_validator("child_name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("child_name must not be blank")
        return value

    @model_validator(mode="after")
    def no_duplicate_choices(self) -> "ProfileWriteDto":
        groups = [
            self.safety.allergies.items,
            self.safety.restrictions.items,
            self.food_preferences.family_foods,
            self.food_preferences.difficult_textures,
            self.food_preferences.difficult_tastes,
            self.food_preferences.presentation_preferences,
        ]
        for items in groups:
            values = [(item.code, item.custom_name) for item in items]
            if len(values) != len(set(values)):
                raise ValueError("duplicate profile choices")
        return self


class ConsentWriteDto(StrictDto):
    kind: ConsentKind
    granted: StrictBool


class OnboardingWriteRequest(StrictDto):
    profile: ProfileWriteDto
    consents: list[ConsentWriteDto]

    @model_validator(mode="after")
    def required_consents(self) -> "OnboardingWriteRequest":
        by_kind = {item.kind: item.granted for item in self.consents}
        if len(self.consents) != 3 or set(by_kind) != {
            "account_privacy",
            "photo_analysis",
            "ai_training",
        }:
            raise ValueError("all three consent kinds are required once")
        if not by_kind["account_privacy"] or not by_kind["photo_analysis"]:
            raise ValueError("required consents must be granted")
        return self


class SafeFoodDto(SafeFoodWriteDto):
    id: str


class SafeFoodsDto(StrictDto):
    status: Literal["none", "listed"]
    items: list[SafeFoodDto]


class UserProfileDto(ProfileWriteDto):
    user_id: str
    safe_foods: SafeFoodsDto
    updated_at: datetime


class UserConsentDto(StrictDto):
    id: str
    user_id: str
    kind: ConsentKind
    granted: bool
    document_version: str
    recorded_at: datetime


class OnboardingResponse(StrictDto):
    profile: UserProfileDto | None
    consents: list[UserConsentDto]
