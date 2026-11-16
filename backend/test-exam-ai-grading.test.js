const test = require("node:test");
const assert = require("node:assert/strict");
const models = require("./src/models");
const aiService = require("./src/services/examGradingAi.service");
const examAttemptService = require("./src/services/examAttempt.service");

const originalExamFindOne = models.Exam.findOne;
const originalAttemptFindOne = models.ExamAttempt.findOne;
const originalAiRequest = aiService.requestExamGradingSuggestions;

test.afterEach(() => {
  models.Exam.findOne = originalExamFindOne;
  models.ExamAttempt.findOne = originalAttemptFindOne;
  aiService.requestExamGradingSuggestions = originalAiRequest;
});

test("la suggestion IA ne transmet pas l'identité et ne publie aucune note", async () => {
  const exam = {
    questions: [{
      id: 4,
      question: "Explique la photosynthèse.",
      type: "OPEN",
      points: "2.00",
      options: null,
      correctAnswer: null,
    }],
  };
  const attempt = {
    student: { firstName: "Alice", lastName: "Example", email: "alice@example.test" },
    answers: [{ questionId: 4, answerText: "Les plantes utilisent la lumière.", selectedOption: null }],
  };
  let sentQuestions;

  models.Exam.findOne = async () => exam;
  models.ExamAttempt.findOne = async () => attempt;
  aiService.requestExamGradingSuggestions = async (questions) => {
    sentQuestions = questions;
    return {
      grades: [{
        question_id: 4,
        points_obtained: 1,
        feedback: "Réponse partielle.",
        rationale: "Une idée est présente.",
      }],
    };
  };

  const result = await examAttemptService.suggestExamCopyGrades({
    examId: 10,
    attemptId: 11,
    teacherId: 12,
  });

  assert.equal(sentQuestions[0].student_answer, "Les plantes utilisent la lumière.");
  assert.equal("student" in sentQuestions[0], false);
  assert.equal(JSON.stringify(sentQuestions).includes("alice@example.test"), false);
  assert.deepEqual(result.suggestions, [{
    questionId: 4,
    pointsObtained: 1,
    feedback: "Réponse partielle.",
    rationale: "Une idée est présente.",
  }]);
  assert.equal(attempt.status, undefined);
});

test("la suggestion IA rejette une note supérieure au barème", async () => {
  models.Exam.findOne = async () => ({
    questions: [{ id: 4, question: "Question", type: "OPEN", points: 2, options: null }],
  });
  models.ExamAttempt.findOne = async () => ({
    answers: [{ questionId: 4, answerText: "Réponse", selectedOption: null }],
  });
  aiService.requestExamGradingSuggestions = async () => ({
    grades: [{ question_id: 4, points_obtained: 3, feedback: "OK", rationale: "OK" }],
  });

  await assert.rejects(
    examAttemptService.suggestExamCopyGrades({ examId: 10, attemptId: 11, teacherId: 12 }),
    { statusCode: 502, message: "Le service IA a retourné une suggestion de correction invalide." },
  );
});
