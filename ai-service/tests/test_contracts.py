import unittest
from types import SimpleNamespace
from unittest.mock import patch

from pydantic import ValidationError

from app.schemas.document import DocumentIndexRequest
from app.schemas.exam_grading import ExamGradingRequest, ExamGradingResponse
from app.schemas.question import QuestionGenerationRequest, QuestionGenerationResponse
from app.core.config import MAX_DOCUMENT_CHARACTERS
from app.services.exam_grading_service import suggest_exam_grades
from app.services.llm_service import is_document_overview_request


class ServiceContractTests(unittest.TestCase):
    def test_document_index_request_limits_text(self):
        with self.assertRaises(ValidationError):
            DocumentIndexRequest(
                document_id=1,
                course_id=1,
                teacher_id=1,
                text="x" * (MAX_DOCUMENT_CHARACTERS + 1),
            )

    def test_question_generation_requires_document_scope(self):
        with self.assertRaises(ValidationError):
            QuestionGenerationRequest(query="cours", course_id=1)

    def test_question_response_validates_nested_options(self):
        with self.assertRaises(ValidationError):
            QuestionGenerationResponse.model_validate({
                "questions": [{
                    "id": "q1",
                    "type": "mcq",
                    "question": "Question",
                    "options": [{"id": "A", "text": "Réponse"}],
                }],
            })

    def test_document_overview_requests_are_detected(self):
        self.assertTrue(is_document_overview_request("Est-ce que ce document est bien structuré ?"))
        self.assertTrue(is_document_overview_request("Générer des idées de questions"))
        self.assertFalse(is_document_overview_request("Quelle est la date mentionnée ?"))

    def test_exam_grading_request_accepts_question_without_answer_key(self):
        request = ExamGradingRequest.model_validate({
            "questions": [{
                "question_id": 1,
                "question": "Explique la photosynthèse.",
                "type": "OPEN",
                "points": 2,
                "student_answer": "Les plantes utilisent la lumière.",
            }],
        })
        self.assertIsNone(request.questions[0].expected_answer)

    def test_exam_grading_response_rejects_negative_scores(self):
        with self.assertRaises(ValidationError):
            ExamGradingResponse.model_validate({
                "grades": [{
                    "question_id": 1,
                    "points_obtained": -1,
                    "feedback": "",
                    "rationale": "",
                }],
            })

    def test_exam_grading_rejects_scores_above_question_maximum(self):
        request = ExamGradingRequest.model_validate({
            "questions": [{
                "question_id": 1,
                "question": "Explique la photosynthèse.",
                "type": "OPEN",
                "points": 2,
                "student_answer": "Réponse",
            }],
        })
        model = SimpleNamespace(invoke=lambda prompt: SimpleNamespace(content=(
            '{"grades":[{"question_id":1,"points_obtained":3,"feedback":"Non",'
            '"rationale":"Non"}]}'
        )))

        with patch("app.services.exam_grading_service._get_model", return_value=model):
            with self.assertRaisesRegex(ValueError, "hors barème"):
                suggest_exam_grades(request)


if __name__ == "__main__":
    unittest.main()
