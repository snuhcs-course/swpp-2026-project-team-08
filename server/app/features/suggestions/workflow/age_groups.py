# AI-generated with Claude Opus 5.5, 2026-11-25, reviewed by Jaemin Kim
# Changed: 자녀 연령대(AgeGroup) 코드를 프롬프트에 풀어 쓰기 위한 설명 사전 추가

"""자녀 연령대(`AgeGroup`) 코드의 프롬프트용 설명.

LLM 에는 코드(`AGE_4_5`) 대신 나이 범위를 보낸다.
모든 `AgeGroup` 에 설명이 있어야 하며 테스트가 이를 확인한다.
"""

from app.models.user_profile_enums import AgeGroup

AGE_GROUP_DESCRIPTIONS: dict[AgeGroup, str] = {
    AgeGroup.UNDER_2: "만 2세 미만",
    AgeGroup.AGE_2_3: "만 2~3세",
    AgeGroup.AGE_4_5: "만 4~5세",
    AgeGroup.AGE_6_8: "만 6~8세",
    AgeGroup.AGE_9_12: "만 9~12세",
    AgeGroup.AGE_13_PLUS: "만 13세 이상",
}


def describe_age_group(code: str) -> str:
    """연령대 코드를 나이 범위로 바꾼다. 알 수 없는 코드는 그대로 돌려준다."""
    try:
        return AGE_GROUP_DESCRIPTIONS[AgeGroup(code)]
    except (ValueError, KeyError):
        return code
