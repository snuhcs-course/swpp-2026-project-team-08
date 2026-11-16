# AI-generated with GPT-6, 2026-11-11, reviewed by Haechan Jung
# Changed: 공용 재료 목록의 마지막 적재 파일 해시 저장

"""배포 적재가 성공한 JSONL 두 파일의 해시. 공용 목록과 같은 트랜잭션에서 갱신한다."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.timezone import now_kst


class IngredientCatalogState(Base):
    __tablename__ = "ingredient_catalog_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_kst)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=now_kst, onupdate=now_kst
    )
