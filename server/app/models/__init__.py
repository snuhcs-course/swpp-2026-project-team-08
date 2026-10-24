# AI-generated with GPT-6, 2026-10-24, reviewed by Haechan Jung
# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
"""모든 테이블 모델.

여기서 import 해야 `Base.metadata` 에 테이블이 등록된다 (Alembic autogenerate 와 테스트의
`create_all` 이 필요로 한다). 새 모델 파일을 만들면 아래에 추가한다.
"""

from app.models.food_item import FoodItem
from app.models.ingredient import Ingredient
from app.models.ingredient_restriction import IngredientRestriction
from app.models.meal import Meal
from app.models.meal_food_ingredient import MealFoodIngredient
from app.models.restriction import Restriction
from app.models.review_food_result import ReviewFoodResult
from app.models.review_ingredient_result import ReviewIngredientResult
from app.models.safe_food import SafeFood
from app.models.user import User
from app.models.user_consent import UserConsent
from app.models.user_profile import UserProfile
from app.models.user_profile_choice import UserProfileChoice
from app.models.user_suggestion import UserSuggestion

__all__ = ["User"]

from app.models.suggestion_meal_link import SuggestionMealLink

__all__ += ["UserProfile", "UserProfileChoice", "SafeFood", "UserConsent"]
__all__ += ["Ingredient"]
__all__ += ["MealFoodIngredient"]
__all__ += ["Meal", "FoodItem"]
__all__ += ["SuggestionMealLink"]
__all__ += ["ReviewFoodResult", "ReviewIngredientResult", "UserSuggestion"]


__all__ += ["IngredientRestriction", "Restriction"]
