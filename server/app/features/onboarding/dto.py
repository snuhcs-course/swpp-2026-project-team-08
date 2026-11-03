# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
# AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 온보딩 요청·응답을 restrictions 목록과 StrEnum 기반으로 재편
# AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
# Changed: 식생활 유형 추가, 익숙한 음식의 조리 방법을 선택 입력으로 변경

"""온보딩 요청과 응답의 모양.

값 검증은 DB 제약이 아니라 이 DTO 가 맡는다. enum 값은 모두 대문자이며,
허용 값 밖의 값과 정의하지 않은 필드는 422 로 거절된다.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, StrictBool, field_validator, model_validator

from app.models.restriction_enums import RestrictionType
from app.models.user_consent_enums import UserConsentKind
from app.models.user_profile_enums import AgeGroup, DietaryPattern


class StrictDto(BaseModel):
    model_config = ConfigDict(extra="forbid")


class SafeFoodWriteDto(StrictDto):
    """안전 음식 입력. id 는 서버가 발급하므로 받지 않는다.

    조리 방법과 제공 메모는 선택 입력이다. 공백뿐인 조리 방법은 null 로 저장한다.
    """

    name: str
    preparation: str | None
    presentation_note: str | None

    @field_validator("name")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("value must not be blank")
        return value

    @field_validator("preparation")
    @classmethod
    def blank_to_none(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        return value


class ProfileWriteDto(StrictDto):
    child_name: str
    age_group: AgeGroup
    restrictions: list[RestrictionType]
    # 식생활 유형. null 은 미응답이다. 필드는 생략할 수 없다.
    dietary_pattern: DietaryPattern | None
    safe_foods: list[SafeFoodWriteDto]

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


class SafeFoodDto(SafeFoodWriteDto):
    id: str


class UserProfileDto(StrictDto):
    user_id: str
    child_name: str
    age_group: AgeGroup
    restrictions: list[RestrictionType]
    dietary_pattern: DietaryPattern | None
    safe_foods: list[SafeFoodDto]
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
