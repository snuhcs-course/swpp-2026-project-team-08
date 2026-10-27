# AI-generated with GPT-6, 2026-10-23, reviewed by Haechan Jung
"""Unit: onboarding DTO choices, consent and age range. No HTTP/DB."""

import pytest
from pydantic import ValidationError

from app.features.onboarding.dto import OnboardingWriteRequest, ProfileChoiceDto
from tests.fixtures.onboarding import request_body


@pytest.mark.parametrize("age", ["under-2", "2-3", "4-5", "6-8", "9-12", "13-plus"])
def test_all_supported_age_groups_are_accepted(age):
    body = request_body()
    body["profile"]["age_group"] = age
    assert OnboardingWriteRequest.model_validate(body).profile.age_group == age


@pytest.mark.parametrize("age", ["", "0", "adult"], ids=["empty", "number", "unsupported"])
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


@pytest.mark.parametrize(
    "code,custom", [("eggs", None), (None, "Family dish")], ids=["catalog", "custom"]
)
def test_choice_accepts_exactly_one_value(code, custom):
    choice = ProfileChoiceDto(code=code, custom_name=custom)
    assert (choice.code, choice.custom_name) == (code, custom)


@pytest.mark.parametrize(
    "code,custom",
    [(None, None), ("eggs", "Dish"), ("none", None), (" ", None), (None, " ")],
    ids=["neither", "both", "reserved-none", "blank-code", "blank-custom"],
)
def test_choice_rejects_missing_or_conflicting_values(code, custom):
    with pytest.raises(ValidationError):
        ProfileChoiceDto(code=code, custom_name=custom)
