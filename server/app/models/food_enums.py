# AI-generated with GPT-6, 2026-10-19, reviewed by Seoyeon Heo
# Changed: 화면 디자인 및 식사 흐름 개선

from enum import StrEnum


class FoodPreparation(StrEnum):
    RAW_UNHEATED = "raw"
    BOILED = "boiled"
    STEAMED = "steamed"
    PAN_FRIED = "pan_fried"
    STIR_FRIED = "stir_fried"
    BAKED_ROASTED = "baked_roasted"
    MASHED_BLENDED = "mashed_blended"
    OTHER = "other"
