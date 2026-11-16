from typing import Any, Literal

from pydantic import BaseModel, Field


class LLMRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    role: Literal["TEACHER", "STUDENT", "ADMIN"] = "TEACHER"
    context: dict[str, Any] = Field(default_factory=dict)
