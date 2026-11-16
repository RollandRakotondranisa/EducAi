import json
import logging
from typing import Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from ..core.config import (
    GEMINI_MAX_RETRIES,
    GEMINI_MODEL,
    GEMINI_QUESTION_TEMPERATURE,
    GEMINI_TIMEOUT,
    GOOGLE_API_KEY,
)
from ..schemas.question import QuestionGenerationResponse
from prompts.question_prompt import QUESTION_GENERATION_PROMPT
from .rag_service import rag_service


logger = logging.getLogger(__name__)


class QuestionService:
    """
    Service de génération de questions pédagogiques.
    """

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GOOGLE_API_KEY,
            temperature=GEMINI_QUESTION_TEMPERATURE,
            request_timeout=GEMINI_TIMEOUT,
            retries=GEMINI_MAX_RETRIES,
        )

    def generate_questions(
        self,
        context: str,
        number_of_questions: int = 5,
        question_type: str = "mcq",
        difficulty: str = "medium",
    ) -> dict:
        """
        Génère des questions basées sur un contexte.
        """
        
        if not context or not context.strip():
            raise ValueError("Le contexte est vide")

        if number_of_questions < 1:
            raise ValueError("Le nombre de questions doit être >= 1")

        prompt = QUESTION_GENERATION_PROMPT.format(
            context=context,
            number_of_questions=number_of_questions,
            question_type=question_type,
            difficulty=difficulty,
        )

        response = self.llm.invoke(prompt)
        
        content = response.content
        
        if not isinstance(content, str):
            content = str(content)

        # Parser JSON avec validation
        try:
            result = json.loads(content)
            
            # Valider la structure
            if "questions" not in result:
                raise ValueError("Structure JSON invalide: clé 'questions' manquante")
            
            if not isinstance(result["questions"], list):
                raise ValueError("Structure JSON invalide: 'questions' doit être une liste")
            
            # Valider chaque question
            for i, q in enumerate(result["questions"]):
                if "id" not in q or "question" not in q:
                    raise ValueError(
                        f"Question {i}: structure invalide (id et question requis)"
                    )
                if q.get("type") == "mcq":
                    if "options" not in q or len(q["options"]) != 4:
                        raise ValueError(
                            f"Question {i}: QCM doit avoir exactement 4 options"
                        )
                    if "correct_answer" not in q:
                        raise ValueError(
                            f"Question {i}: QCM doit avoir correct_answer"
                        )
            
            validated = QuestionGenerationResponse.model_validate(result)
            logger.info("Generated %s questions successfully", len(validated.questions))
            return validated.model_dump()

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            logger.error("Question generation returned invalid JSON")
            raise ValueError(
                "Le modèle n'a pas retourné un JSON valide. "
                f"Erreur: {str(e)}"
            ) from e

    def generate_from_document(
        self,
        query: str,
        teacher_id: int,
        course_id: int,
        document_id: int,
        number_of_questions: int = 5,
        question_type: str = "mcq",
        difficulty: str = "medium",
    ) -> dict:
        """
        Génère des questions en utilisant le RAG.
        """
        
        try:
            context = rag_service.get_context(
                query=query,
                course_id=course_id,
                document_id=document_id,
                teacher_id=teacher_id,
                k=5,
            )

            if not context:
                raise ValueError(
                    f"Aucun contenu pertinent trouvé dans le cours {course_id}"
                )

            logger.info(f"RAG context retrieved for course {course_id}")

            return self.generate_questions(
                context=context,
                number_of_questions=number_of_questions,
                question_type=question_type,
                difficulty=difficulty,
            )

        except Exception as e:
            logger.error(f"Error in generate_from_document: {str(e)}")
            raise


# Instance globale
question_service = QuestionService()
