const test = require("node:test");
const assert = require("node:assert/strict");
const models = require("./src/models");
const sequelize = require("./src/config/database");
const service = require("./src/services/examAttempt.service");

const originalMethods = {
  examFindOne: models.Exam.findOne,
  attemptFindOne: models.ExamAttempt.findOne,
  answerCreate: models.ExamAnswer.create,
  resultFindOrCreate: models.ExamResult.findOrCreate,
  transaction: sequelize.transaction,
};

test.afterEach(() => {
  models.Exam.findOne = originalMethods.examFindOne;
  models.ExamAttempt.findOne = originalMethods.attemptFindOne;
  models.ExamAnswer.create = originalMethods.answerCreate;
  models.ExamResult.findOrCreate = originalMethods.resultFindOrCreate;
  sequelize.transaction = originalMethods.transaction;
});

test("la correction manuelle calcule la note et crée les réponses laissées vides", async () => {
  const exam = {
    questions: [
      { id: 4, points: 2 },
      { id: 5, points: 3 },
    ],
  };
  const answerUpdates = [];
  const createdAnswers = [];
  const attemptUpdates = [];
  const resultUpdates = [];
  const attempt = {
    studentId: 8,
    submittedAt: new Date("2026-10-18T06:00:00Z"),
    answers: [{
      questionId: 4,
      selectedOption: "Option A",
      update: async (values) => answerUpdates.push(values),
    }],
    update: async (values) => attemptUpdates.push(values),
  };
  const result = { update: async (values) => resultUpdates.push(values) };
  let transactionCommitted = false;

  models.Exam.findOne = async () => exam;
  models.ExamAttempt.findOne = async () => attempt;
  models.ExamAnswer.create = async (values) => createdAnswers.push(values);
  models.ExamResult.findOrCreate = async () => [result, false];
  sequelize.transaction = async () => ({
    commit: async () => { transactionCommitted = true; },
    rollback: async () => assert.fail("transaction should not roll back"),
  });

  const response = await service.gradeExamCopy({
    examId: 10,
    attemptId: 11,
    teacherId: 12,
    grades: [
      { questionId: 4, pointsObtained: 1.5, feedback: "Partiellement correct." },
      { questionId: 5, pointsObtained: 0, feedback: null },
    ],
  });

  assert.equal(transactionCommitted, true);
  assert.equal(answerUpdates[0].pointsObtained, 1.5);
  assert.equal(answerUpdates[0].isCorrected, true);
  assert.equal(createdAnswers[0].questionId, 5);
  assert.equal(createdAnswers[0].answerText, null);
  assert.deepEqual(attemptUpdates[0], { status: "GRADED", score: 1.5, totalPoints: 5 });
  assert.equal(resultUpdates[0].score, 1.5);
  assert.equal(resultUpdates[0].percentage, 30);
  assert.equal(resultUpdates[0].unansweredQuestions, 1);
  assert.equal(response.attempt, attempt);
  assert.equal(response.result, result);
});

test("la correction refuse une note supérieure au maximum de la question", async () => {
  models.Exam.findOne = async () => ({ questions: [{ id: 4, points: 2 }] });
  models.ExamAttempt.findOne = async () => ({ answers: [] });

  await assert.rejects(
    service.gradeExamCopy({
      examId: 10,
      attemptId: 11,
      teacherId: 12,
      grades: [{ questionId: 4, pointsObtained: 2.5 }],
    }),
    { statusCode: 400, message: "Une note de correction est invalide." },
  );
});

test("la soumission place la tentative en attente de correction", async () => {
  const updates = [];
  const attempt = {
    status: "IN_PROGRESS",
    update: async (values) => {
      updates.push(values);
      Object.assign(attempt, values);
    },
  };
  models.ExamAttempt.findOne = async () => attempt;

  const response = await service.submitAttempt({ attemptId: 11, studentId: 8 });

  assert.equal(response.status, "SUBMITTED");
  assert.equal(updates[0].status, "SUBMITTED");
  assert.ok(updates[0].submittedAt instanceof Date);
});
