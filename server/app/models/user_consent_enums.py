# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: 동의 종류 UserConsentKind StrEnum 정의

"""사용자 동의 기록에 쓰는 고정 값 집합."""

from enum import StrEnum


class UserConsentKind(StrEnum):
    """동의 문서의 종류."""

    ACCOUNT_PRIVACY = "ACCOUNT_PRIVACY"
    PHOTO_ANALYSIS = "PHOTO_ANALYSIS"
    AI_TRAINING = "AI_TRAINING"
