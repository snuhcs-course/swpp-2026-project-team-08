# AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
# Changed: Safe Food 기능 제거
# AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
# Changed: 거부 음식 프로필 저장
# AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
# Changed: 감각 프로필 저장
# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
# AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 온보딩 요청·응답을 restrictions 목록과 StrEnum 기반으로 재편
# AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
# Changed: 식생활 유형 추가, 익숙한 음식의 조리 방법을 선택 입력으로 변경
# AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
# Changed: 익숙한 음식 명시적 없음 null 계약
# AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
# Changed: 거부 음식 사용자 지정 사유 검증

"""온보딩 요청과 응답의 모양.

값 검증은 DB 제약이 아니라 이 DTO 가 맡는다. enum 값은 모두 대문자이며,
허용 값 밖의 값과 정의하지 않은 필드는 422 로 거절된다.
"""

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, StrictBool, field_validator, model_validator

from app.models.difficulty_enums import DifficultyReason
from app.models.difficulty_reason_value import DifficultyReasonValue
from app.models.meal_enums import MealCookingMethodInput
from app.models.restriction_enums import RestrictionType
from app.models.user_consent_enums import UserConsentKind
from app.models.user_profile_enums import AgeGroup, DietaryPattern


class StrictDto(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RefusedFoodDto(StrictDto):
    id: str
    name: str
    cooking_method: MealCookingMethodInput | None
    reasons: list[DifficultyReasonValue]

    @field_validator("id", "name")
    @classmethod
    def nonblank(cls, value: str) -> str:
        value = value.strip()
        if not value or len(value) > 200:
            raise ValueError("value must be between 1 and 200 characters")
        return value

    @field_validator("reasons")
    @classmethod
    def unique_reasons(cls, value: list[DifficultyReasonValue]) -> list[DifficultyReasonValue]:
        if len(value) != len(set(value)):
            raise ValueError("duplicate reasons")
        return value


class ProfileWriteDto(StrictDto):
    child_name: str
    age_group: AgeGroup
    restrictions: list[RestrictionType]
    # 식생활 유형. null 은 미응답이다. 필드는 생략할 수 없다.
    dietary_pattern: DietaryPattern | None
    sensory_textures: list[str] | None = None
    sensory_note: str | None = None
    refused_foods: list[RefusedFoodDto] | None = None

    @field_validator("refused_foods")
    @classmethod
    def unique_refused_food_ids(
        cls, value: list[RefusedFoodDto] | None
    ) -> list[RefusedFoodDto] | None:
        if value is not None and len({item.id for item in value}) != len(value):
            raise ValueError("duplicate refused food ids")
        return value

    @field_validator("sensory_textures")
    @classmethod
    def valid_sensory_textures(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return value
        if len(value) != len(set(value)):
            raise ValueError("duplicate sensory textures")
        for item in value:
            parts = item.split(".")
            if len(parts) != 2:
                raise ValueError("invalid sensory texture")
            codes = [re.sub(r"(?<!^)(?=[A-Z])", "_", part).upper() for part in parts]
            try:
                DifficultyReason("TEXTURE." + ".".join(codes))
            except ValueError as exc:
                raise ValueError("invalid sensory texture") from exc
        return value

    @field_validator("child_name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("child_name must not be blank")
        return value

    @field_validator("restrictions")
    @classmethod
    def valid_restrictions(cls, value: list[RestrictionType]) -> list[RestrictionType]:
        if len(value) != len(set(value)):
            raise ValueError("duplicate restrictions")
        allergies = [item for item in value if item.category == "ALLERGY"]
        # 알러지를 모르는 상태는 없다. 없으면 ALLERGY.NONE 을 보낸다.
        if not allergies:
            raise ValueError("an allergy answer is required; use ALLERGY.NONE for none")
        if RestrictionType.ALLERGY_NONE in value and len(allergies) > 1:
            raise ValueError("ALLERGY.NONE cannot be combined with other allergies")
        return value


class ConsentWriteDto(StrictDto):
    kind: UserConsentKind
    granted: StrictBool


class OnboardingWriteRequest(StrictDto):
    profile: ProfileWriteDto
    consents: list[ConsentWriteDto]

    @model_validator(mode="after")
    def required_consents(self) -> "OnboardingWriteRequest":
        by_kind = {item.kind: item.granted for item in self.consents}
        if len(self.consents) != len(UserConsentKind) or set(by_kind) != set(UserConsentKind):
            raise ValueError("all consent kinds are required once")
        if (
            not by_kind[UserConsentKind.ACCOUNT_PRIVACY]
            or not by_kind[UserConsentKind.PHOTO_ANALYSIS]
        ):
            raise ValueError("required consents must be granted")
        return self


class UserProfileDto(StrictDto):
    user_id: str
    child_name: str
    age_group: AgeGroup
    restrictions: list[RestrictionType]
    dietary_pattern: DietaryPattern | None
    sensory_textures: list[str]
    sensory_note: str
    refused_foods: list[RefusedFoodDto]
    updated_at: datetime


class UserConsentDto(StrictDto):
    id: str
    user_id: str
    kind: UserConsentKind
    granted: bool
    document_version: str
    recorded_at: datetime


class OnboardingResponse(StrictDto):
    profile: UserProfileDto | None
    consents: list[UserConsentDto]
