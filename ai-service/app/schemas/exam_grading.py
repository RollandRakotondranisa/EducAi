from typing import Literal

from pydantic import BaseModel, Field


class ExamGradingQuestion(BaseModel):
    question_id: int = Field(..., ge=1)
    question: str = Field(..., min_length=1, max_length=10000)
    type: Literal["MCQ", "OPEN"]
    points: float = Field(..., gt=0)
    options: list[str] = Field(default_factory=list, max_length=20)
    expected_answer: str | None = Field(default=None, max_length=10000)
    student_answer: str | None = Field(default=None, max_length=20000)


class ExamGradingRequest(BaseModel):
    questions: list[ExamGradingQuestion] = Field(..., min_length=1, max_length=100)


class ExamGradeSuggestion(BaseModel):
    question_id: int = Field(..., ge=1)
    points_obtained: float = Field(..., ge=0)
    feedback: str = Field(..., max_length=4000)
    rationale: str = Field(..., max_length=4000)


class ExamGradingResponse(BaseModel):
    grades: list[ExamGradeSuggestion]
