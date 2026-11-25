# AI-generated with GPT-6, 2026-11-25, reviewed by Seoyeon Heo
# Changed: 사용자 지정 어려움 사유 검증
"""Validation for predefined and user-written difficulty reasons."""

import json
import re
from typing import Annotated

from pydantic import AfterValidator

from app.models.difficulty_enums import DifficultyReason


def validate_reason(value: str) -> str:
    if not value.startswith("CUSTOM:"):
        DifficultyReason(value)
        return value
    try:
        parts = json.loads(value[7:])
    except (ValueError, TypeError) as exc:
        raise ValueError("invalid custom reason") from exc
    if not isinstance(parts, list) or len(parts) != 3:
        raise ValueError("invalid custom reason")
    category, subcategory, note = parts
    if not isinstance(category, str) or category not in {
        "OTHER",
        "TEXTURE",
        "TASTE",
        "SMELL",
        "COLOR",
        "TEMPERATURE",
        "PIECE_SIZE",
        "ARRANGEMENT",
    }:
        raise ValueError("invalid custom reason category")
    if not isinstance(note, str) or not note.strip() or len(note) > 2000:
        raise ValueError("invalid custom reason text")
    if category == "TEXTURE":
        if not isinstance(subcategory, str):
            raise ValueError("invalid texture category")
        code = re.sub(r"(?<!^)(?=[A-Z])", "_", subcategory).upper()
        if not any(item.value.startswith(f"TEXTURE.{code}.") for item in DifficultyReason):
            raise ValueError("invalid texture category")
    elif subcategory is not None:
        raise ValueError("invalid custom reason subcategory")
    return value


DifficultyReasonValue = Annotated[str, AfterValidator(validate_reason)]
