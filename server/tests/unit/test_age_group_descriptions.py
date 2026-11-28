# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 자녀 연령대 설명 사전이 모든 코드를 덮는지 검증 추가

"""자녀 연령대 코드가 프롬프트에서 나이 범위로 바뀌는지 검증한다."""

from app.features.suggestions.workflow.age_groups import (
    AGE_GROUP_DESCRIPTIONS,
    describe_age_group,
)
from app.models.user_profile_enums import AgeGroup


def test_every_age_group_has_a_description() -> None:
    assert set(AGE_GROUP_DESCRIPTIONS) == set(AgeGroup)


def test_descriptions_are_readable_not_codes() -> None:
    for age_group, text in AGE_GROUP_DESCRIPTIONS.items():
        assert not text.isascii(), age_group
        assert age_group.value not in text, age_group


def test_describe_age_group_turns_a_code_into_its_description() -> None:
    assert describe_age_group("AGE_4_5") == "만 4~5세"
    assert describe_age_group("UNDER_2") == "만 2세 미만"


def test_describe_age_group_leaves_an_unknown_code_unchanged() -> None:
    assert describe_age_group("SOMETHING_NEW") == "SOMETHING_NEW"
