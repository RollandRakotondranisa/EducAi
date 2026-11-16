from typing import Literal

from pydantic import BaseModel, Field, model_validator


class QuestionOption(BaseModel):
    """
    Une option possible pour une question QCM.
    """

    id: str = Field(
        ...,
        description="Identifiant de l'option (A, B, C, D)"
    )

    text: str = Field(
        ...,
        description="Texte de l'option",
        min_length=1
    )


class Question(BaseModel):
    """
    Représente une question pédagogique.
    """

    id: str = Field(..., description="Identifiant unique de la question")

    type: Literal["mcq", "open"] = Field(
        ...,
        description="Type de question (mcq ou open)"
    )

    question: str = Field(
        ...,
        description="Texte de la question",
        min_length=1
    )

    options: list[QuestionOption] = Field(
        default_factory=list,
        description="Options (pour QCM)"
    )

    correct_answer: str | None = Field(
        default=None,
        description="Réponse correcte"
    )

    explanation: str | None = Field(
        default=None,
        description="Explication pédagogique"
    )

    difficulty: Literal["easy", "medium", "hard"] = Field(
        default="medium",
        description="Niveau de difficulté"
    )

    points: int = Field(
        default=1,
        ge=1,
        description="Nombre de points"
    )

    @model_validator(mode="after")
    def validate_mcq(self):
        if self.type == "mcq":
            if len(self.options) != 4:
                raise ValueError("Un QCM doit avoir exactement 4 options")
            if not self.correct_answer:
                raise ValueError("Un QCM doit avoir une réponse correcte")
        return self


class QuestionGenerationRequest(BaseModel):
    """
    Requête de génération de questions.
    """

    query: str = Field(
        ...,
        min_length=1,
        description="Requête pour trouver le contexte"
    )

    teacher_id: int = Field(..., ge=1, description="ID du professeur propriétaire")

    document_id: int = Field(..., ge=1, description="ID du document source")

    course_id: int = Field(
        ...,
        ge=1,
        description="ID du cours"
    )

    number_of_questions: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Nombre de questions à générer"
    )

    question_type: Literal["mcq", "open"] = Field(
        default="mcq",
        description="Type de questions"
    )

    difficulty: Literal["easy", "medium", "hard"] = Field(
        default="medium",
        description="Niveau de difficulté"
    )


class QuestionGenerationResponse(BaseModel):
    """
    Réponse complète de génération de questions.
    """

    questions: list[Question] = Field(
        ...,
        description="Liste des questions générées"
    )

    source: str | None = Field(
        default=None,
        description="Source (document ID, etc.)"
    )
