import json

from langchain_google_genai import ChatGoogleGenerativeAI

from ..core.config import GOOGLE_API_KEY
from ..prompts.correction_prompt import CORRECTION_PROMPT


class CorrectionService:

    def __init__(self):

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.1,
        )

    def correct_answer(
        self,
        question: str,
        expected_answer: str,
        student_answer: str,
        points: int = 1,
    ):

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

        try:

            result = json.loads(content)

        except json.JSONDecodeError as error:

            raise ValueError(
                "Le modèle n'a pas retourné un JSON valide."
            ) from error

        return result


correction_service = CorrectionService()