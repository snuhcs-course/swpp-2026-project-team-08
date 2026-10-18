from enum import Enum

class FoodPreparation(str, Enum):
    RAW_UNHEATED = "raw"
    BOILED = "boiled"
    STEAMED = "steamed"
    PAN_FRIED = "pan_fried"
    STIR_FRIED = "stir_fried"
    BAKED_ROASTED = "baked_roasted"
    MASHED_BLENDED = "mashed_blended"
    OTHER = "other"