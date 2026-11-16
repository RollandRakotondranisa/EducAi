from pydantic import BaseModel, Field


class CorrectionRequest(BaseModel):
    """
    Données nécessaires pour corriger une réponse ouverte.
    """

    question: str = Field(
        ...,
        min_length=1,
        description="Texte de la question"
    )

    expected_answer: str = Field(
        ...,
        min_length=1,
        description="Réponse attendue/modèle"
    )

    student_answer: str = Field(
        ...,
        min_length=1,
        description="Réponse de l'étudiant"
    )

    points: int = Field(
        default=1,
        ge=1,
        description="Nombre de points maximum"
    )


class CorrectionResponse(BaseModel):
    """
    Résultat de la correction IA.
    """

    score: float = Field(
        ...,
        ge=0,
        description="Score obtenu"
    )

    max_score: float = Field(
        ...,
        ge=0,
        description="Score maximum"
    )

    is_correct: bool = Field(
        ...,
        description="La réponse est-elle correcte (seuil >= 80%)"
    )

    feedback: str = Field(
        ...,
        description="Retour pour l'étudiant"
    )

    explanation: str = Field(
        ...,
        description="Explication pédagogique"
    )

    strengths: list[str] = Field(
        default_factory=list,
        description="Points forts de la réponse"
    )

    weaknesses: list[str] = Field(
        default_factory=list,
        description="Points faibles de la réponse"
    )
