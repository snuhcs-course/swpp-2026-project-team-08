# AI-generated with GPT-6, 2026-10-17, reviewed by Haechan Jung
"""API v1 라우터 집합.

각 기능(features/*)의 라우터를 /api/v1 아래로 모은다.
호환 불가능한 변경이 생기면 해당 기능에 v2 라우터를 추가하고 /api/v2 로 별도 마운트한다.
"""

from fastapi import APIRouter

from app.features.auth.router import router as auth_router
from app.features.ingredients.router import router as ingredients_router
from app.features.meals.router import router as meals_router
from app.features.onboarding.router import router as onboarding_router
from app.features.suggestions.router import router as suggestions_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(onboarding_router)
api_v1_router.include_router(ingredients_router)
api_v1_router.include_router(meals_router)
api_v1_router.include_router(suggestions_router)
