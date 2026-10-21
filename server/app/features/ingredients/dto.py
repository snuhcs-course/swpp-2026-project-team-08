"""Ingredient catalog API shapes."""

from pydantic import BaseModel, ConfigDict, field_validator


class IngredientResolveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str | None = None
    name: str

    @field_validator("name")
    @classmethod
    def nonblank_name(cls, value: str) -> str:
        value = " ".join(value.split())
        if not value:
            raise ValueError("name must not be blank")
        return value


class IngredientResponse(BaseModel):
    id: str
    name: str
