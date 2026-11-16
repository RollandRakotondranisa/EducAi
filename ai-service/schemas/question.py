from typing import Literal

from pydantic import BaseModel, Field


class QuestionOption(BaseModel):
    """
    Une option possible pour une question QCM.
    """

    id: str = Field(
        ...,
        description="Identifiant de l'option"
    )

    text: str = Field(
        ...,
        description="Texte de l'option"
    )


class Question(BaseModel):
    """
    Représente une question pédagogique.
    """

    id: str

    type: Literal[
        "mcq",
        "open"
    ]

    question: str

    options: list[QuestionOption] = []

    correct_answer: str | None = None

    explanation: str | None = None

    difficulty: Literal[
        "easy",
        "medium",
        "hard"
    ] = "medium"

    points: int = 1


class QuestionGenerationResponse(BaseModel):
    """
    Réponse complète de génération de questions.
    """

    questions: list[Question]

    source: str | None = None