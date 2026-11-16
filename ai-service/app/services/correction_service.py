import json
import logging

from langchain_google_genai import ChatGoogleGenerativeAI

from ..core.config import (
    GEMINI_MAX_RETRIES,
    GEMINI_CORRECTION_TEMPERATURE,
    GEMINI_MODEL,
    GEMINI_TIMEOUT,
    GOOGLE_API_KEY,
)
from prompts.correction_prompt import CORRECTION_PROMPT
from ..schemas.correction import CorrectionResponse


logger = logging.getLogger(__name__)


class CorrectionService:
    """
    Service de correction IA pour les réponses ouvertes.
    
    Pour les QCM, la correction est déterministe (pas besoin d'IA).
    """

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GOOGLE_API_KEY,
            temperature=GEMINI_CORRECTION_TEMPERATURE,
            request_timeout=GEMINI_TIMEOUT,
            retries=GEMINI_MAX_RETRIES,
        )

    def correct_answer(
        self,
        question: str,
        expected_answer: str,
        student_answer: str,
        points: int = 1,
    ) -> dict:
        """
        Corrige une réponse ouverte d'étudiant.
        """
        
        if not question or not expected_answer or not student_answer:
            raise ValueError(
                "question, expected_answer et student_answer sont requis"
            )

        if points < 1:
            raise ValueError("points doit être >= 1")

        prompt = CORRECTION_PROMPT.format(
            question=question,
            expected_answer=expected_answer,
            student_answer=student_answer,
            points=points,
        )

        response = self.llm.invoke(prompt)

        content = response.content

        if not isinstance(content, str):
            content = str(content)

        # Parser JSON avec validation
        try:
            result = json.loads(content)

            # Valider la structure
            required_fields = ["score", "max_score", "is_correct", "feedback", "explanation"]
            for field in required_fields:
                if field not in result:
                    raise ValueError(
                        f"Champ obligatoire manquant: {field}"
                    )

            # Valider les scores
            score = float(result["score"])
            max_score = float(result["max_score"])

            if score < 0 or score > max_score:
                logger.warning(
                    f"Invalid score: {score}/{max_score}. Clipping to valid range."
                )
                result["score"] = min(max(score, 0), max_score)

            if max_score != points:
                logger.warning(
                    f"max_score mismatch: expected {points}, got {max_score}"
                )
                result["max_score"] = points
                max_score = float(points)

            # Valider is_correct
            if not isinstance(result["is_correct"], bool):
                result["is_correct"] = result["score"] >= (max_score * 0.8)

            logger.info(
                f"Answer corrected: score={result['score']}/{max_score}, "
                f"is_correct={result['is_correct']}"
            )

            validated = CorrectionResponse.model_validate(result)
            return validated.model_dump()

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error in correction: {str(e)}")
            logger.error("Correction returned invalid JSON")
            raise ValueError(
                "Le modèle n'a pas retourné un JSON valide. "
                f"Erreur: {str(e)}"
            ) from e


# Instance globale
correction_service = CorrectionService()
