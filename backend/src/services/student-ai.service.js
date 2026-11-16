const fetch = require("node-fetch");
const {
  Course,
  CourseStudent,
  Document,
  Exam,
  ExamResult,
} = require("../models");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8001";
const NO_DATA = "Je n'ai trouvé aucun résultat correspondant.";
const NO_ACCESS = "Je ne peux pas accéder aux informations d'un autre étudiant.";
const COURSE_ACCESS_ERROR = "Vous n'êtes pas autorisé à accéder à l'assistance IA de ce cours.";
const NO_DOCUMENTS = "Les documents de ce cours ne sont pas encore disponibles pour l'assistance IA.";

const normalizeNumber = (value) => (value === null || value === undefined ? null : Number(value));
const isAccessibleCourse = (courseIds, courseId) => courseIds.includes(Number(courseId));

const requestedStudentId = (message) => {
  const match = message.match(/(?:étudiant|student)\s*(?:n°|no|numéro|id)?\s*(\d+)/iu);
  return match ? Number(match[1]) : null;
};

const getStudentCourseIds = async (studentId) => {
  const rows = await CourseStudent.findAll({
    where: { studentId },
    attributes: ["courseId"],
  });
  return rows.map((row) => row.courseId);
};

const getAccessibleCourse = async (studentId, courseId) => {
  const enrollment = await CourseStudent.findOne({ where: { studentId, courseId: Number(courseId) } });
  if (!enrollment) return null;
  return Course.findByPk(Number(courseId), {
    attributes: ["id", "name", "code", "description", "teacherId"],
  });
};

const getMyCourses = async (studentId) => {
  const courseIds = await getStudentCourseIds(studentId);
  if (!courseIds.length) return [];
  const courses = await Course.findAll({
    where: { id: courseIds },
    attributes: ["id", "name", "code", "description", "targetProgram", "targetLevel"],
    order: [["name", "ASC"]],
  });
  return courses.map((course) => course.toJSON());
};

const getMyExams = async (studentId) => {
  const courseIds = await getStudentCourseIds(studentId);
  if (!courseIds.length) return [];
  const exams = await Exam.findAll({
    where: { courseId: courseIds, status: "PUBLISHED" },
    include: [{ model: Course, as: "course", attributes: ["id", "name", "code"] }],
    attributes: ["id", "courseId", "title", "description", "startDate", "endDate", "duration", "status"],
    order: [["startDate", "DESC"]],
  });
  return exams.map((exam) => exam.toJSON());
};

const getMyResults = async (studentId, courseId) => {
  const courseIds = await getStudentCourseIds(studentId);
  if (courseId !== undefined && !isAccessibleCourse(courseIds, courseId)) return null;
  const scopedCourseIds = courseId === undefined ? courseIds : [Number(courseId)];
  if (!scopedCourseIds.length) return [];

  const results = await ExamResult.findAll({
    where: { studentId },
    include: [{
      model: Exam,
      as: "exam",
      where: { courseId: scopedCourseIds },
      attributes: ["id", "courseId", "title"],
      include: [{ model: Course, as: "course", attributes: ["id", "name", "code"] }],
    }],
    attributes: ["id", "examId", "score", "totalPoints", "percentage", "status", "submittedAt"],
    order: [["submittedAt", "DESC"]],
  });
  return results.map((result) => {
    const value = result.toJSON();
    return {
      id: value.id,
      examId: value.examId,
      examen: value.exam,
      score: normalizeNumber(value.score),
      totalPoints: normalizeNumber(value.totalPoints),
      percentage: normalizeNumber(value.percentage),
      status: value.status,
      submittedAt: value.submittedAt,
    };
  });
};

const getMyAverage = async (studentId, courseId) => {
  const results = await getMyResults(studentId, courseId);
  if (results === null) return null;
  const completed = results.filter((result) => (
    result.status === "PRESENT"
    && result.score !== null
    && result.totalPoints
  ));
  if (!completed.length) return { average: null, resultCount: 0 };
  const averageOn20 = completed.reduce(
    (sum, result) => sum + ((result.score / result.totalPoints) * 20),
    0,
  ) / completed.length;
  const averagePercentage = completed.reduce(
    (sum, result) => sum + ((result.score / result.totalPoints) * 100),
    0,
  ) / completed.length;
  return {
    average: Number(averageOn20.toFixed(2)),
    averageOn20: Number(averageOn20.toFixed(2)),
    averagePercentage: Number(averagePercentage.toFixed(2)),
    resultCount: completed.length,
  };
};

const getMyCourseResults = async (studentId, courseId) => getMyResults(studentId, Number(courseId));

const getMyExamResult = async (studentId, examId) => {
  const courseIds = await getStudentCourseIds(studentId);
  const exam = await Exam.findOne({
    where: { id: Number(examId), courseId: courseIds, status: "PUBLISHED" },
    include: [{ model: Course, as: "course", attributes: ["id", "name", "code"] }],
    attributes: ["id", "courseId", "title", "status"],
  });
  if (!exam) return null;
  const result = await ExamResult.findOne({
    where: { studentId, examId: Number(examId) },
    attributes: ["id", "examId", "score", "totalPoints", "percentage", "status", "submittedAt"],
  });
  if (!result) return null;
  const value = result.toJSON();
  return { ...value, score: normalizeNumber(value.score), totalPoints: normalizeNumber(value.totalPoints), percentage: normalizeNumber(value.percentage), exam: exam.toJSON() };
};

const classifyQuestion = (message) => {
  const value = message.toLocaleLowerCase("fr-FR");
  const databaseWords = /(cours|examen|examens|note|notes|résultat|résultats|moyenne|évaluation|passé|passés|score)/u.test(value);
  const documentWords = /(document|cours|chapitre|notion|notions|expli|réviser|révision|concept|leçon)/u.test(value);
  const combinedWords = /(note|résultat|moyenne|score|\d+\s*\/\s*\d+|j'ai eu).*(réviser|notion|chapitre|cours|expli)|(?:réviser|notion|chapitre|cours|expli).*(note|résultat|moyenne|score|\d+\s*\/\s*\d+|j'ai eu)/u.test(value);
  if (combinedWords) return "DATABASE_AND_RAG";
  if (documentWords && !databaseWords) return "DOCUMENT";
  if (databaseWords) return "DATABASE";
  return "GENERAL";
};

const findCourseFromMessage = (courses, message) => {
  const value = message.toLocaleLowerCase("fr-FR");
  return courses.find((course) => [course.name, course.code].filter(Boolean).some((term) => value.includes(String(term).toLocaleLowerCase("fr-FR"))));
};

const requestGemini = async (message, context) => {
  const response = await fetch(`${AI_SERVICE_URL}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, role: "STUDENT", context }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || data.message || "Le service IA est indisponible");
    error.statusCode = response.status >= 500 ? 503 : response.status;
    throw error;
  }
  return data.data?.response || data.response || NO_DATA;
};

const findAccessibleDocument = async (studentId, message, documentId) => {
  const courseIds = await getStudentCourseIds(studentId);
  if (!courseIds.length) return null;
  const documents = await Document.findAll({
    where: { courseId: courseIds, ...(documentId ? { id: Number(documentId) } : {}) },
    include: [{ model: Course, as: "course", attributes: ["id", "name", "code", "teacherId"] }],
    attributes: ["id", "courseId", "originalName", "status"],
  });
  if (documentId && !documents.length) return NO_ACCESS;
  if (documents.length === 1) return documents[0];
  const value = message.toLocaleLowerCase("fr-FR");
  return documents.find((document) => {
    const course = document.course || {};
    return [document.originalName, course.name, course.code].some((term) => term && value.includes(String(term).toLocaleLowerCase("fr-FR")));
  }) || null;
};

const requestDocumentContext = async (studentId, document, message) => {
  const response = await fetch(`${AI_SERVICE_URL}/api/ai/documents/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      document_id: document.id,
      course_id: document.courseId,
      teacher_id: document.course.teacherId,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || "Le document n'est pas encore disponible.");
    error.statusCode = response.status;
    throw error;
  }
  return data.data?.response || data.response || NO_DATA;
};

const requestCourseContext = async (course, message) => {
  const response = await fetch(`${AI_SERVICE_URL}/api/ai/courses/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      course_id: course.id,
      teacher_id: course.teacherId,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || NO_DOCUMENTS);
    error.statusCode = response.status;
    throw error;
  }
  return data.data || data;
};

const askStudentCourseAssistant = async (studentId, courseId, message) => {
  const course = await getAccessibleCourse(studentId, courseId);
  if (!course) {
    const error = new Error(COURSE_ACCESS_ERROR);
    error.statusCode = 403;
    throw error;
  }

  const documents = await Document.findAll({
    where: { courseId: Number(courseId), status: ["UPLOADED", "PROCESSING", "PROCESSED"] },
    attributes: ["id", "originalName", "courseId"],
  });
  if (!documents.length) {
    return { response: NO_DOCUMENTS, type: "document_unavailable", source: "rag", data: {}, sources: [] };
  }

  try {
    const result = await requestCourseContext(course.toJSON(), message);
    return {
      response: result.response || NO_DOCUMENTS,
      type: "document_result",
      source: "rag",
      data: { course: { id: course.id, name: course.name, code: course.code } },
      sources: (result.sources || []).map((source) => {
        const document = documents.find((item) => item.id === source.document_id);
        return document
          ? { document_id: document.id, document_name: document.originalName, ...(source.page ? { page: source.page } : {}) }
          : null;
      }).filter(Boolean),
    };
  } catch (error) {
    if (error.statusCode === 409) {
      return { response: NO_DOCUMENTS, type: "document_unavailable", source: "rag", data: {}, sources: [] };
    }
    throw error;
  }
};

const askStudentAssistant = async (studentId, message, options = {}) => {
  const askedStudentId = requestedStudentId(message);
  const asksForAnotherStudent = /(?:autre|un|une|mon|ma)\s+(?:étudiant|étudiante|ami|amie)|étudiant\s*(?:n°|no|numéro|id)?\s*\d+/iu.test(message);
  if (askedStudentId !== null || asksForAnotherStudent) {
    return { response: NO_ACCESS, type: "access_control", source: "access_control", data: {}, sources: [] };
  }
  const type = classifyQuestion(message);
  const courses = await getMyCourses(studentId);
  const course = findCourseFromMessage(courses, message);
  const courseId = options.courseId ? Number(options.courseId) : course?.id;

  if (type === "DOCUMENT" || type === "DATABASE_AND_RAG") {
    return {
      response: "Ouvrez l'assistance IA depuis le cours concerné pour interroger ses documents.",
      type,
      source: "course_scope_required",
      data: {},
      sources: [],
    };
  }

  if (type === "GENERAL") {
    const response = await requestGemini(message, { routing: { source: "GENERAL" } });
    return { response, type: "general", source: "gemini", data: {}, sources: [] };
  }

  let data = {};
  if (/(moyenne|moyen)/u.test(message.toLocaleLowerCase("fr-FR"))) data.average = await getMyAverage(studentId, courseId);
  if (/(cours)/u.test(message.toLocaleLowerCase("fr-FR"))) data.courses = courses;
  if (/(examen|examens)/u.test(message.toLocaleLowerCase("fr-FR"))) data.exams = await getMyExams(studentId);
  if (/(note|notes|résultat|résultats|score|passé|passés)/u.test(message.toLocaleLowerCase("fr-FR"))) data.results = await getMyResults(studentId, courseId);
  if (!Object.keys(data).length) data.courses = courses;
  const answer = await requestGemini(message, { routing: { source: "DATABASE" }, cours: courses, donnees: data });
  return { response: answer, type: "database_result", source: "database", data, sources: [] };
};

module.exports = {
  askStudentAssistant,
  askStudentCourseAssistant,
  classifyQuestion,
  getMyCourses,
  getMyExams,
  getMyResults,
  getMyAverage,
  getMyCourseResults,
  getMyExamResult,
  isAccessibleCourse,
  requestedStudentId,
};
