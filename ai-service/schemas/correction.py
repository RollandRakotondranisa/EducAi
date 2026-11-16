from pydantic import BaseModel, Field


class CorrectionRequest(BaseModel):
    """
    Données nécessaires pour corriger une réponse.
    """

    question: str = Field(
        ...,
        min_length=1
    )

    expected_answer: str = Field(
        ...,
        min_length=1
    )

    student_answer: str = Field(
        ...,
        min_length=1
    )

    points: int = Field(
        default=1,
        ge=1
    )


class CorrectionResponse(BaseModel):
    """
    Résultat de la correction IA.
    """

    score: float = Field(
        ...,
        ge=0
    )

    max_score: float = Field(
        ...,
        ge=0
    )

    is_correct: bool

    feedback: str

    explanation: str

    strengths: list[str] = []

    weaknesses: list[str] = []