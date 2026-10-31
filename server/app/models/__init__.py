# AI-generated with GPT-6, 2026-10-30, reviewed by Seoyeon Heo
# Changed: Register meal ingredient model
# AI-generated with Claude Sonnet 5.5, 2026-10-15, reviewed by Jaemin Kim
# Changed: server bootstraping
# AI-generated with Grok 4.6, 2026-10-15, reviewed by Doyeon Kim
# Changed: 식사 기록·로그인 기능 추가
# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
# Changed: 추천 카드·저장된 추천 기능 추가
# AI-generated with Claude Sonnet 5.5, 2026-10-31, reviewed by Jaemin Kim
# Changed: DB 스키마 개편에 맞춰 모델 등록 갱신

"""모든 테이블 모델.

여기서 import 해야 `Base.metadata` 에 테이블이 등록된다 (Alembic autogenerate 와 테스트의
`create_all` 이 필요로 한다). 새 모델 파일을 만들면 아래에 추가한다.
"""

from app.models.ingredient import Ingredient
from app.models.meal import Meal
from app.models.meal_food import MealFood
from app.models.meal_food_ingredient import MealFoodIngredient
from app.models.user import User
from app.models.user_consent import UserConsent
from app.models.user_email_change_attempt import UserEmailChangeAttempt
from app.models.user_profile import UserProfile
from app.models.user_profile_safe_food import UserProfileSafeFood
from app.models.user_suggestion import UserSuggestion

__all__ = ["User"]

__all__ += ["UserProfile", "UserProfileSafeFood", "UserConsent"]
__all__ += ["UserEmailChangeAttempt"]
__all__ += ["Ingredient"]
__all__ += ["MealFoodIngredient"]
__all__ += ["Meal", "MealFood"]
__all__ += ["UserSuggestion"]
