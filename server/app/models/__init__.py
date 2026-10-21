# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
"""모든 테이블 모델.

여기서 import 해야 `Base.metadata` 에 테이블이 등록된다 (Alembic autogenerate 와 테스트의
`create_all` 이 필요로 한다). 새 모델 파일을 만들면 아래에 추가한다.
"""

from app.models.food_item import FoodItem
from app.models.ingredient import Ingredient
from app.models.meal import Meal
from app.models.meal_food import MealFood
from app.models.meal_food_ingredient import MealFoodIngredient
from app.models.meal_log import MealLog
from app.models.meal_review import MealReview
from app.models.meal_suggestion import MealSuggestion
from app.models.safe_food import SafeFood
from app.models.user import User
from app.models.user_consent import UserConsent
from app.models.user_profile import UserProfile
from app.models.user_profile_choice import UserProfileChoice

__all__ = ["User", "MealLog", "MealFood", "MealReview", "MealSuggestion"]

from app.models.suggestion import Suggestion
from app.models.suggestion_action import SuggestionAction
from app.models.suggestion_batch import SuggestionBatch
from app.models.suggestion_meal_link import SuggestionMealLink
from app.models.suggestion_try import SuggestionTry

__all__ += ["SuggestionBatch", "Suggestion", "SuggestionAction", "SuggestionTry"]
__all__ += ["UserProfile", "UserProfileChoice", "SafeFood", "UserConsent"]
__all__ += ["Ingredient"]
__all__ += ["MealFoodIngredient"]
__all__ += ["Meal", "FoodItem"]
__all__ += ["SuggestionMealLink"]
