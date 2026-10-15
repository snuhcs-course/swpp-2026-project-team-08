# AI-generated with Grok 4.6, 2026-10-15, reviewed by Jaemin Kim
"""모든 테이블 모델.

여기서 import 해야 `Base.metadata` 에 테이블이 등록된다 (Alembic autogenerate 와 테스트의
`create_all` 이 필요로 한다). 새 모델 파일을 만들면 아래에 추가한다.
"""

from app.models.meal_food import MealFood
from app.models.meal_log import MealLog
from app.models.meal_review import MealReview
from app.models.meal_suggestion import MealSuggestion
from app.models.user import User

__all__ = ["User", "MealLog", "MealFood", "MealReview", "MealSuggestion"]
