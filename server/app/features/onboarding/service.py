# AI-generated with GPT-6, 2026-10-27, reviewed by Seoyeon Heo
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 프로필 제한을 restrictions 목록으로 저장하고 안전 음식은 전체 교체로 변경

"""한 사용자의 온보딩 데이터를 읽고 통째로 교체한다."""

from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import now_kst
from app.features.onboarding.consent_version import DOCUMENT_VERSION
from app.models import UserConsent, UserProfile, UserProfileSafeFood
from app.models.restriction_enums import RestrictionType
from app.models.user_consent_enums import UserConsentKind
from app.models.user_profile_enums import AgeGroup


@dataclass(frozen=True)
class SafeFoodInput:
    name: str
    preparation: str
    presentation_note: str | None


@dataclass(frozen=True)
class ConsentInput:
    kind: UserConsentKind
    granted: bool


@dataclass(frozen=True)
class OnboardingInput:
    child_name: str
    age_group: AgeGroup
    restrictions: tuple[RestrictionType, ...]
    safe_foods: tuple[SafeFoodInput, ...]
    consents: tuple[ConsentInput, ...]


@dataclass(frozen=True)
class OnboardingSnapshot:
    profile: UserProfile | None
    safe_foods: tuple[UserProfileSafeFood, ...]
    consents: tuple[UserConsent, ...]


class OnboardingService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def read(self, user_id: int) -> OnboardingSnapshot:
        profile = await self._session.get(UserProfile, user_id)
        safe_foods: tuple[UserProfileSafeFood, ...] = ()
        if profile is not None:
            # 순서는 저장하지 않는다. 저장한 순서대로 id 가 커지므로 id 순으로 읽는다.
            safe_foods = tuple(
                (
                    await self._session.scalars(
                        select(UserProfileSafeFood)
                        .where(UserProfileSafeFood.user_id == user_id)
                        .order_by(UserProfileSafeFood.id)
                    )
                ).all()
            )
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
        return OnboardingSnapshot(profile, safe_foods, tuple(latest.values()))

    async def write(self, user_id: int, data: OnboardingInput) -> OnboardingSnapshot:
        profile = await self._session.get(UserProfile, user_id)
        if profile is None:
            profile = UserProfile(user_id=user_id)
            self._session.add(profile)
        profile.child_name = data.child_name
        profile.age_group = data.age_group
        profile.restrictions = [item.value for item in data.restrictions]
        # 안전 음식만 바뀌어도 프로필의 수정 시각이 갱신되도록 직접 지정한다.
        profile.updated_at = now_kst()
        await self._session.flush()

        # 안전 음식은 id 를 받지 않고 저장할 때마다 전체를 교체한다. 요청 순서대로 넣으므로
        # id 도 그 순서로 커지고, 이 테이블을 참조하는 곳이 없어서 id 가 바뀌어도 문제가 없다.
        await self._session.execute(
            delete(UserProfileSafeFood).where(UserProfileSafeFood.user_id == user_id)
        )
        for food in data.safe_foods:
            self._session.add(
                UserProfileSafeFood(
                    user_id=user_id,
                    name=food.name,
                    preparation=food.preparation,
                    presentation_note=food.presentation_note,
                )
            )
            # 한 행씩 flush 해서 요청 순서대로 id 가 발급되게 한다.
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
