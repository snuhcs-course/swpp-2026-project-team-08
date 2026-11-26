# AI-generated with GPT-6, 2026-11-26, reviewed by Seoyeon Heo
# Changed: Safe Food 기능 제거
# AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
# Changed: 거부 음식 프로필 저장
# AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
# Changed: 감각 프로필 저장
# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
# AI-generated with GPT-6, 2026-11-02, reviewed by Seoyeon Heo
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 프로필 제한을 restrictions 목록으로 저장하고 안전 음식은 전체 교체로 변경
# AI-generated with Claude Sonnet 5.5, 2026-11-03, reviewed by Jaemin Kim
# Changed: 식생활 유형 저장, 조리 방법 없는 안전 음식 허용
# AI-generated with GPT-6, 2026-11-15, reviewed by Haechan Jung
# Changed: 익숙한 음식 없음 상태와 음식 목록 원자적 저장

"""한 사용자의 온보딩 데이터를 읽고 통째로 교체한다."""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import now_kst
from app.features.onboarding.consent_version import DOCUMENT_VERSION
from app.models import UserConsent, UserProfile
from app.models.restriction_enums import RestrictionType
from app.models.user_consent_enums import UserConsentKind
from app.models.user_profile_enums import AgeGroup, DietaryPattern


@dataclass(frozen=True)
class ConsentInput:
    kind: UserConsentKind
    granted: bool


@dataclass(frozen=True)
class OnboardingInput:
    child_name: str
    age_group: AgeGroup
    restrictions: tuple[RestrictionType, ...]
    dietary_pattern: DietaryPattern | None
    consents: tuple[ConsentInput, ...]
    sensory_textures: tuple[str, ...] | None = None
    sensory_note: str | None = None
    refused_foods: tuple[dict, ...] | None = None


@dataclass(frozen=True)
class OnboardingSnapshot:
    profile: UserProfile | None
    consents: tuple[UserConsent, ...]


class OnboardingService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def read(self, user_id: int) -> OnboardingSnapshot:
        profile = await self._session.get(UserProfile, user_id)
        rows = (
            await self._session.scalars(
                select(UserConsent)
                .where(UserConsent.user_id == user_id)
                .order_by(UserConsent.recorded_at.desc(), UserConsent.id.desc())
            )
        ).all()
        latest: dict[UserConsentKind, UserConsent] = {}
        for row in rows:
            latest.setdefault(row.kind, row)
        return OnboardingSnapshot(profile, tuple(latest.values()))

    async def write(self, user_id: int, data: OnboardingInput) -> OnboardingSnapshot:
        profile = await self._session.get(UserProfile, user_id)
        if profile is None:
            profile = UserProfile(user_id=user_id)
            self._session.add(profile)
        profile.child_name = data.child_name
        profile.age_group = data.age_group
        profile.restrictions = [item.value for item in data.restrictions]
        profile.dietary_pattern = data.dietary_pattern
        if data.sensory_textures is not None:
            profile.sensory_textures = list(data.sensory_textures)
        if data.sensory_note is not None:
            profile.sensory_note = data.sensory_note
        if data.refused_foods is not None:
            profile.refused_foods = list(data.refused_foods)
        # 안전 음식만 바뀌어도 프로필의 수정 시각이 갱신되도록 직접 지정한다.
        profile.updated_at = now_kst()
        await self._session.flush()

        previous_consents = {row.kind: row for row in (await self.read(user_id)).consents}
        for consent in data.consents:
            prior = previous_consents.get(consent.kind)
            if prior is None or (prior.granted, prior.document_version) != (
                consent.granted,
                DOCUMENT_VERSION,
            ):
                self._session.add(
                    UserConsent(
                        user_id=user_id,
                        kind=consent.kind,
                        granted=consent.granted,
                        document_version=DOCUMENT_VERSION,
                    )
                )
        await self._session.flush()
        self._session.expire_all()
        return await self.read(user_id)
