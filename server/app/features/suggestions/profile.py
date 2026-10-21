# AI-generated with GPT-6, 2026-10-22, reviewed by Haechan Jung
"""Load supported standard restrictions without blocking suggestion generation."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.suggestions.ingredients import ChildRestrictions, RestrictionId
from app.models import UserProfile, UserProfileChoice


async def load_restrictions(session: AsyncSession, user_id: int) -> ChildRestrictions:
    profile = await session.get(UserProfile, user_id)
    if profile is None:
        return ChildRestrictions()

    categories = []
    if profile.allergy_status == "specified":
        categories.append("allergy")
    if profile.restriction_status == "specified":
        categories.append("restriction")
    if not categories:
        return ChildRestrictions()

    choices = (
        await session.scalars(
            select(UserProfileChoice).where(
                UserProfileChoice.user_id == user_id,
                UserProfileChoice.category.in_(categories),
            )
        )
    ).all()
    ids: set[RestrictionId] = set()
    for choice in choices:
        # Skip free text and unsupported codes; retain supported choices in the same profile.
        if choice.custom_name is not None or choice.code is None:
            continue
        try:
            ids.add(RestrictionId(choice.code))
        except ValueError:
            continue
    return ChildRestrictions(ids=frozenset(ids))
