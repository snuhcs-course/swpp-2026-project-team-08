# AI-generated with Claude Sonnet 5.5, 2026-11-18, reviewed by Jaemin Kim
# Changed: 어려워한 이유 코드를 프롬프트에 풀어 쓰기 위한 설명 사전 추가

"""어려워한 이유(`DifficultyReason`) 코드의 프롬프트용 설명.

LLM 에는 코드(`TEXTURE.HARDNESS.HARD`) 대신 "~해서" 로 끝나는 이유 문장을 보낸다.
보호자가 고른 값이므로 의학적 판단이 아니라 기록된 사실이다.
모든 `DifficultyReason` 에 설명이 있어야 하며 테스트가 이를 확인한다.
"""

from app.models.difficulty_enums import DifficultyReason

REASON_DESCRIPTIONS: dict[DifficultyReason, str] = {
    # 냄새
    DifficultyReason.SMELL_FRUIT: "과일 향이 나서",
    DifficultyReason.SMELL_HERB: "허브·풀 향이 나서",
    DifficultyReason.SMELL_MUSHROOM: "버섯 향이 나서",
    DifficultyReason.SMELL_TOASTED: "구운·볶은 고소한 향이 나서",
    DifficultyReason.SMELL_VANILLA: "바닐라처럼 달콤한 향이 나서",
    DifficultyReason.SMELL_DAIRY: "우유·치즈 같은 유제품 냄새가 나서",
    DifficultyReason.SMELL_MEATY: "고기 냄새가 나서",
    DifficultyReason.SMELL_SULFUR: "달걀·양배추류 같은 유황 냄새가 나서",
    DifficultyReason.SMELL_SEA: "바다·생선 비린내가 나서",
    DifficultyReason.SMELL_FERMENTED: "발효된 냄새가 나서",
    DifficultyReason.SMELL_SPICE: "향신료 냄새가 나서",
    DifficultyReason.SMELL_MINT: "민트처럼 시원한 향이 나서",
    DifficultyReason.SMELL_SMOKE: "훈연·탄 냄새가 나서",
    # 맛
    DifficultyReason.TASTE_SWEET: "맛이 달아서",
    DifficultyReason.TASTE_SALTY: "맛이 짜서",
    DifficultyReason.TASTE_SOUR: "맛이 셔서",
    DifficultyReason.TASTE_BITTER: "쓴맛이 나서",
    DifficultyReason.TASTE_SAVORY: "감칠맛이 강해서",
    # 음식 배치
    DifficultyReason.ARRANGEMENT_EVEN: "접시에 음식이 고르게 펼쳐져 있어서",
    DifficultyReason.ARRANGEMENT_UNEVEN: "접시에 음식이 고르지 않게 놓여 있어서",
    DifficultyReason.ARRANGEMENT_CLUSTERED: "접시에 음식이 한곳에 몰려 있어서",
    DifficultyReason.ARRANGEMENT_OTHER: "접시 위 음식의 배치가 불편해서",
    # 재료 조각 크기
    DifficultyReason.PIECE_SIZE_FINE: "재료가 아주 잘게 다져져 있어서",
    DifficultyReason.PIECE_SIZE_SMALL: "재료 조각이 작아서",
    DifficultyReason.PIECE_SIZE_LARGE: "재료 조각이 커서",
    # 제공 온도
    DifficultyReason.TEMPERATURE_HOT: "음식이 뜨거워서",
    DifficultyReason.TEMPERATURE_WARM: "음식이 따뜻해서",
    DifficultyReason.TEMPERATURE_COOL: "음식이 차갑거나 시원해서",
    DifficultyReason.TEMPERATURE_ROOM: "음식이 실온이어서",
    # 색
    DifficultyReason.COLOR_RED: "색이 빨개서",
    DifficultyReason.COLOR_YELLOW: "색이 노래서",
    DifficultyReason.COLOR_GREEN: "색이 초록색이어서",
    DifficultyReason.COLOR_BROWN: "색이 갈색이어서",
    DifficultyReason.COLOR_WHITE: "색이 하얘서",
    DifficultyReason.COLOR_OTHER: "색이 거슬려서",
    # 잘 모르겠음
    DifficultyReason.NOT_SURE: "보호자도 이유를 잘 모르겠다고 해서 (구체적인 이유 없음)",
    # 식감: 단단한 정도
    DifficultyReason.TEXTURE_HARDNESS_SOFT: "식감이 무르고 부드러워서",
    DifficultyReason.TEXTURE_HARDNESS_FIRM: "식감이 적당히 단단해서",
    DifficultyReason.TEXTURE_HARDNESS_HARD: "식감이 딱딱하고 단단해서",
    # 식감: 씹을 때 부서지는 느낌
    DifficultyReason.TEXTURE_BREAKING_CRUMBLY: "씹을 때 푸스스 부서져서",
    DifficultyReason.TEXTURE_BREAKING_CRUNCHY: "씹을 때 아삭하거나 바삭해서",
    DifficultyReason.TEXTURE_BREAKING_BRITTLE: "씹을 때 딱 하고 쉽게 부서져서",
    # 식감: 씹는 정도
    DifficultyReason.TEXTURE_CHEWING_TENDER: "연해서 씹는 느낌이 거의 없어서",
    DifficultyReason.TEXTURE_CHEWING_CHEWY: "쫄깃해서 오래 씹어야 해서",
    DifficultyReason.TEXTURE_CHEWING_TOUGH: "질겨서 씹기 힘들어서",
    # 식감: 달라붙는 정도
    DifficultyReason.TEXTURE_STICKINESS_NON_STICKY: "달라붙지 않고 서로 떨어져서",
    DifficultyReason.TEXTURE_STICKINESS_STICKY: "끈적하게 달라붙어서",
    DifficultyReason.TEXTURE_STICKINESS_GUMMY: "이에 쩍 달라붙는 젤리 같아서",
    # 식감: 탄력
    DifficultyReason.TEXTURE_SPRINGINESS_SPRINGY: "탱탱하게 튕겨서",
    DifficultyReason.TEXTURE_SPRINGINESS_RUBBERY: "고무처럼 질기게 튕겨서",
    # 식감: 액체의 걸쭉한 정도
    DifficultyReason.TEXTURE_THICKNESS_FLUID: "물처럼 흐르는 액체여서",
    DifficultyReason.TEXTURE_THICKNESS_THIN: "국물이나 소스가 묽어서",
    DifficultyReason.TEXTURE_THICKNESS_THICK: "국물이나 소스가 걸쭉해서",
    DifficultyReason.TEXTURE_THICKNESS_VISCOUS: "아주 진득하고 끈적한 액체여서",
    # 식감: 촉촉한 정도
    DifficultyReason.TEXTURE_MOISTURE_DRY: "퍽퍽하고 말라서",
    DifficultyReason.TEXTURE_MOISTURE_MOIST: "촉촉해서",
    DifficultyReason.TEXTURE_MOISTURE_JUICY: "씹으면 즙이 나와서",
    DifficultyReason.TEXTURE_MOISTURE_WET: "물기가 많고 축축해서",
    # 식감: 기름기
    DifficultyReason.TEXTURE_OILINESS_NON_FATTY: "기름기가 없어서",
    DifficultyReason.TEXTURE_OILINESS_OILY: "기름기가 있어서",
    DifficultyReason.TEXTURE_OILINESS_GREASY: "느끼할 만큼 기름져서",
    # 식감: 입자감
    DifficultyReason.TEXTURE_GRAININESS_GRAINY: "알갱이가 씹혀서",
    DifficultyReason.TEXTURE_GRAININESS_GRITTY: "거친 입자가 씹혀서",
    DifficultyReason.TEXTURE_GRAININESS_SANDY: "모래처럼 서걱거려서",
    DifficultyReason.TEXTURE_GRAININESS_MEALY: "푸석하게 가루처럼 부서져서",
    DifficultyReason.TEXTURE_GRAININESS_POWDERY: "가루 같아서",
    # 식감: 촘촘하고 묵직한 정도
    DifficultyReason.TEXTURE_DENSITY_DENSE: "촘촘하고 묵직해서",
    DifficultyReason.TEXTURE_DENSITY_AIRY: "공기가 많아 가볍고 푹신해서",
    # 식감: 표면 촉감
    DifficultyReason.TEXTURE_SURFACE_SMOOTH: "표면이 매끈해서",
    DifficultyReason.TEXTURE_SURFACE_ROUGH: "표면이 거칠어서",
    DifficultyReason.TEXTURE_SURFACE_BUMPY: "표면이 울퉁불퉁해서",
    DifficultyReason.TEXTURE_SURFACE_CRUSTY: "겉이 딱딱한 껍질 같아서",
    DifficultyReason.TEXTURE_SURFACE_FUZZY: "표면이 보송보송하거나 솜털 같아서",
    # 식감: 속의 구조
    DifficultyReason.TEXTURE_STRUCTURE_FIBROUS: "섬유질 같은 결이 느껴져서",
    DifficultyReason.TEXTURE_STRUCTURE_FLESHY: "속이 도톰하고 살집이 있어서",
    DifficultyReason.TEXTURE_STRUCTURE_LAYERED: "겹겹이 층이 져서",
    DifficultyReason.TEXTURE_STRUCTURE_SPONGY: "스펀지처럼 구멍이 많아서",
}


def describe_reason(code: str) -> str:
    """이유 코드를 이유 문장으로 바꾼다. 알 수 없는 코드는 그대로 돌려준다."""
    try:
        return REASON_DESCRIPTIONS[DifficultyReason(code)]
    except (ValueError, KeyError):
        return code
