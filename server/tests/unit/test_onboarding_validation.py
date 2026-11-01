# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
# AI-generated with Claude Sonnet 5.5, 2026-11-02, reviewed by Jaemin Kim
# Changed: 제한 목록·안전 음식·대문자 enum 기준으로 DTO 검증 테스트 재작성
"""Unit: onboarding DTO restrictions, safe foods, consent and age range. No HTTP/DB."""

import pytest
from pydantic import ValidationError

from app.features.onboarding.dto import OnboardingWriteRequest
from app.models.restriction_enums import RestrictionType
from app.models.user_profile_enums import AgeGroup
from tests.fixtures.onboarding import request_body


def _with_restrictions(*values: str) -> dict:
    body = request_body()
    body["profile"]["restrictions"] = list(values)
    return body


@pytest.mark.parametrize("age", [item.value for item in AgeGroup])
def test_all_supported_age_groups_are_accepted(age):
    body = request_body()
    body["profile"]["age_group"] = age
    assert OnboardingWriteRequest.model_validate(body).profile.age_group == age


@pytest.mark.parametrize(
    "age",
    ["", "0", "adult", "4-5", "under-2", "age_4_5"],
    ids=["empty", "number", "unsupported", "old-value", "old-under-2", "lowercase"],
)
def test_unsupported_age_groups_are_rejected(age):
    body = request_body()
    body["profile"]["age_group"] = age
    with pytest.raises(ValidationError):
        OnboardingWriteRequest.model_validate(body)


@pytest.mark.parametrize("value", [False, True], ids=["declined", "granted"])
def test_optional_ai_training_consent_accepts_both_booleans(value):
    body = request_body()
    body["consents"][2]["granted"] = value
    assert OnboardingWriteRequest.model_validate(body).consents[2].granted is value


@pytest.mark.parametrize("value", ["false", 0, 1, None], ids=["text", "zero", "one", "null"])
def test_consent_does_not_coerce_non_booleans(value):
    body = request_body()
    body["consents"][2]["granted"] = value
    with pytest.raises(ValidationError):
        OnboardingWriteRequest.model_validate(body)


def test_consent_kinds_use_uppercase_values():
    body = request_body()
    body["consents"][0]["kind"] = "account_privacy"
    with pytest.raises(ValidationError):
        OnboardingWriteRequest.model_validate(body)


def test_every_consent_kind_is_required_once():
    body = request_body()
    body["consents"] = body["consents"][:2]
    with pytest.raises(ValidationError):
        OnboardingWriteRequest.model_validate(body)
    body = request_body()
    body["consents"][2]["kind"] = "ACCOUNT_PRIVACY"
    with pytest.raises(ValidationError):
        OnboardingWriteRequest.model_validate(body)


@pytest.mark.parametrize("field", ["account_privacy", "photo_analysis"])
def test_required_consents_must_be_granted(field):
    body = request_body()
    next(row for row in body["consents"] if row["kind"] == field.upper())["granted"] = False
    with pytest.raises(ValidationError):
        OnboardingWriteRequest.model_validate(body)


@pytest.mark.parametrize(
    "values",
    [
        ["ALLERGY.NONE"],
        ["ALLERGY.PEANUTS"],
        ["ALLERGY.PEANUTS", "ALLERGY.EGGS", "VEGETARIAN.DAIRY", "DIETARY_APPROACH.GLUTEN_FREE"],
        ["ALLERGY.NONE", "VEGETARIAN.EGGS", "DIETARY_APPROACH.LACTOSE_FREE"],
    ],
    ids=["none", "single", "mixed-categories", "none-with-other-categories"],
)
def test_valid_restriction_lists_are_accepted(values):
    profile = OnboardingWriteRequest.model_validate(_with_restrictions(*values)).profile
    assert [item.value for item in profile.restrictions] == values


@pytest.mark.parametrize(
    "values",
    [
        [],
        ["VEGETARIAN.DAIRY"],
        ["DIETARY_APPROACH.GLUTEN_FREE", "VEGETARIAN.EGGS"],
        ["ALLERGY.NONE", "ALLERGY.PEANUTS"],
        ["ALLERGY.EGGS", "ALLERGY.EGGS"],
        ["ALLERGY.NOT_A_REAL_VALUE"],
        ["PEANUTS"],
        ["allergy.peanuts"],
    ],
    ids=[
        "empty",
        "no-allergy-answer",
        "no-allergy-answer-two-categories",
        "none-with-allergy",
        "duplicate",
        "unknown-value",
        "missing-category",
        "lowercase",
    ],
)
def test_invalid_restriction_lists_are_rejected(values):
    with pytest.raises(ValidationError):
        OnboardingWriteRequest.model_validate(_with_restrictions(*values))


def test_restriction_type_exposes_its_category():
    assert RestrictionType.ALLERGY_EGGS.category == "ALLERGY"
    assert RestrictionType.VEGETARIAN_EGGS.category == "VEGETARIAN"
    assert RestrictionType.DIETARY_APPROACH_GLUTEN_FREE.category == "DIETARY_APPROACH"


def test_safe_foods_may_be_empty():
    body = request_body()
    body["profile"]["safe_foods"] = []
    assert OnboardingWriteRequest.model_validate(body).profile.safe_foods == []


@pytest.mark.parametrize(
    "food",
    [
        {"name": " ", "preparation": "삶기", "presentation_note": None},
        {"name": "감자", "preparation": " ", "presentation_note": None},
        {"name": "감자", "preparation": "삶기"},
        {"id": "1", "name": "감자", "preparation": "삶기", "presentation_note": None},
    ],
    ids=["blank-name", "blank-preparation", "missing-note", "client-id-not-accepted"],
)
def test_invalid_safe_foods_are_rejected(food):
    body = request_body()
    body["profile"]["safe_foods"] = [food]
    with pytest.raises(ValidationError):
        OnboardingWriteRequest.model_validate(body)


@pytest.mark.parametrize("field", ["safety", "food_preferences"])
def test_removed_profile_fields_are_rejected(field):
    body = request_body()
    body["profile"][field] = {}
    with pytest.raises(ValidationError):
        OnboardingWriteRequest.model_validate(body)


def test_blank_child_name_is_rejected():
    body = request_body()
    body["profile"]["child_name"] = "  "
    with pytest.raises(ValidationError):
        OnboardingWriteRequest.model_validate(body)
