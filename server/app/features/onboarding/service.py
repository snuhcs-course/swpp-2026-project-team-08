"""Read and replace one user's onboarding data."""

from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.timezone import now_kst
from app.features.onboarding.consent_version import DOCUMENT_VERSION
from app.models import SafeFood, UserConsent, UserProfile, UserProfileChoice


class SafeFoodNotFoundError(AppError):
    """A submitted safe-food ID does not belong to this user."""


@dataclass(frozen=True)
class ChoiceInput:
    category: str
    position: int
    code: str | None
    custom_name: str | None


@dataclass(frozen=True)
class SafeFoodInput:
    id: int | None
    position: int
    name: str
    preparation: str
    presentation_note: str | None


@dataclass(frozen=True)
class ConsentInput:
    kind: str
    granted: bool


@dataclass(frozen=True)
class OnboardingInput:
    child_name: str
    age_group: str
    allergy_status: str
    restriction_status: str
    smell_sensitivity: str | None
    preferred_temperature: str | None
    new_food_response: str | None
    safe_food_status: str
    choices: tuple[ChoiceInput, ...]
    safe_foods: tuple[SafeFoodInput, ...]
    consents: tuple[ConsentInput, ...]


@dataclass(frozen=True)
class OnboardingSnapshot:
    profile: UserProfile | None
    choices: tuple[UserProfileChoice, ...]
    safe_foods: tuple[SafeFood, ...]
    consents: tuple[UserConsent, ...]


class OnboardingService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def read(self, user_id: int) -> OnboardingSnapshot:
        profile = await self._session.get(UserProfile, user_id)
        choices: tuple[UserProfileChoice, ...] = ()
        safe_foods: tuple[SafeFood, ...] = ()
        if profile is not None:
            choices = tuple(
                (
                    await self._session.scalars(
                        select(UserProfileChoice)
                        .where(UserProfileChoice.user_id == user_id)
                        .order_by(UserProfileChoice.category, UserProfileChoice.position)
                    )
                ).all()
            )
            safe_foods = tuple(
                (
                    await self._session.scalars(
                        select(SafeFood)
                        .where(SafeFood.user_id == user_id)
                        .order_by(SafeFood.position)
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
        latest: dict[str, UserConsent] = {}
        for row in rows:
            latest.setdefault(row.kind, row)
        return OnboardingSnapshot(profile, choices, safe_foods, tuple(latest.values()))

    async def write(self, user_id: int, data: OnboardingInput) -> OnboardingSnapshot:
        previous_foods = (
            await self._session.scalars(select(SafeFood).where(SafeFood.user_id == user_id))
        ).all()
        by_id = {food.id: food for food in previous_foods}
        if any(food.id is not None and food.id not in by_id for food in data.safe_foods):
            raise SafeFoodNotFoundError()

        profile = await self._session.get(UserProfile, user_id)
        if profile is None:
            profile = UserProfile(user_id=user_id)
            self._session.add(profile)
        profile.child_name = data.child_name
        profile.age_group = data.age_group
        profile.allergy_status = data.allergy_status
        profile.restriction_status = data.restriction_status
        profile.smell_sensitivity = data.smell_sensitivity
        profile.preferred_temperature = data.preferred_temperature
        profile.new_food_response = data.new_food_response
        profile.safe_food_status = data.safe_food_status
        profile.updated_at = now_kst()
        await self._session.flush()

        await self._session.execute(
            delete(UserProfileChoice).where(UserProfileChoice.user_id == user_id)
        )
        for choice in data.choices:
            self._session.add(
                UserProfileChoice(
                    user_id=user_id,
                    category=choice.category,
                    position=choice.position,
                    code=choice.code,
                    custom_name=choice.custom_name,
                )
            )

        await self._session.execute(delete(SafeFood).where(SafeFood.user_id == user_id))
        for food in data.safe_foods:
            previous = by_id.get(food.id) if food.id is not None else None
            row = SafeFood(
                user_id=user_id,
                position=food.position,
                name=food.name,
                preparation=food.preparation,
                presentation_note=food.presentation_note,
            )
            if previous is not None:
                row.id = previous.id
                row.created_at = previous.created_at
            self._session.add(row)

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
