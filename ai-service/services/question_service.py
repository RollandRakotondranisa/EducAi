import json

from langchain_google_genai import ChatGoogleGenerativeAI

from ..core.config import GOOGLE_API_KEY
from ..prompts.question_prompt import QUESTION_GENERATION_PROMPT
from ..services.rag_service import rag_service


class QuestionService:

    def __init__(self):

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.3,
        )

    def generate_questions(
        self,
        context: str,
        number_of_questions: int = 5,
        question_type: str = "mcq",
        difficulty: str = "medium",
    ):

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

        try:
            return json.loads(content)

        except json.JSONDecodeError as error:

            raise ValueError(
                "Le modèle n'a pas retourné un JSON valide."
            ) from error

    def generate_from_document(
        self,
        query: str,
        number_of_questions: int = 5,
        question_type: str = "mcq",
        difficulty: str = "medium",
    ):

        context = rag_service.get_context(
            query=query,
            k=5,
        )

        if not context:
            raise ValueError(
                "Aucun contenu pertinent trouvé."
            )

        return self.generate_questions(
            context=context,
            number_of_questions=number_of_questions,
            question_type=question_type,
            difficulty=difficulty,
        )


question_service = QuestionService()