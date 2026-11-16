const fetch = require("node-fetch");
const fs = require("fs");
const FormData = require("form-data");
const { Audit, Course, CourseStudent, Document, Exam, ExamResult, User, UserRequest } = require("../models");
const { askStudentAssistant, askStudentCourseAssistant } = require("./student-ai.service");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8001";

const getOwnedTeacherDocument = async (teacherId, documentId) => {
  const document = await Document.findOne({
    where: { id: documentId },
    include: [{ model: Course, as: "course", where: { teacherId }, attributes: ["id", "teacherId"] }],
  });
  if (!document) {
    const error = new Error("Document introuvable ou accès refusé");
    error.statusCode = 403;
    throw error;
  }
  return document;
};

const indexDocument = async (documentId, teacherId) => {
  const document = await getOwnedTeacherDocument(teacherId, documentId);
  const form = new FormData();
  form.append("file", fs.createReadStream(document.filePath), {
    filename: document.originalName,
    contentType: document.mimeType,
  });

  const analysisResponse = await fetch(`${AI_SERVICE_URL}/api/ai/documents/analyze`, {
    method: "POST",
    headers: form.getHeaders(),
    body: form,
  });
  const analysis = await analysisResponse.json().catch(() => ({}));
  if (!analysisResponse.ok || typeof analysis.text !== "string") {
    throw new Error(analysis.detail || "Impossible d'extraire le texte du document");
  }

  const indexResponse = await fetch(`${AI_SERVICE_URL}/api/ai/documents/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      document_id: document.id,
      course_id: document.courseId,
      teacher_id: teacherId,
      text: analysis.text,
    }),
  });
  const indexData = await indexResponse.json().catch(() => ({}));
  if (!indexResponse.ok) throw new Error(indexData.detail || "Impossible d'indexer le document");
  return indexData;
};

const askDocumentAssistant = async (teacherId, documentId, message) => {
  const document = await getOwnedTeacherDocument(teacherId, documentId);

  const requestChat = async () => {
    const response = await fetch(`${AI_SERVICE_URL}/api/ai/documents/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        document_id: document.id,
        course_id: document.courseId,
        teacher_id: teacherId,
      }),
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  let { response, data } = await requestChat();

  if (
    response.status === 409
    && typeof data.detail === "string"
    && data.detail.startsWith("Aucun index RAG")
  ) {
    await indexDocument(documentId, teacherId);
    ({ response, data } = await requestChat());
  }

  if (!response.ok) {
    const error = new Error(data.detail || "Le document n'est pas encore disponible pour l'assistant IA");
    error.statusCode = response.status;
    throw error;
  }
  return data.data;
};

const getTeacherContext = async (teacherId, courseId, documentId) => {
  const courses = await Course.findAll({
    where: { teacherId, ...(courseId ? { id: courseId } : {}) },
    include: [{
      model: Document,
      as: "documents",
      attributes: ["id", "courseId", "originalName", "extension", "status", "fileSize", "createdAt"],
      required: false,
    }],
    attributes: ["id", "name", "code", "description", "targetProgram", "targetLevel"],
    order: [["createdAt", "DESC"]],
  });

  return courses.map((course) => {
    const value = course.toJSON();
    return {
      id: value.id,
      name: value.name,
      code: value.code,
      description: value.description,
      targetProgram: value.targetProgram,
      targetLevel: value.targetLevel,
      documents: (value.documents || []).filter((document) => !documentId || document.id === documentId).map((document) => ({
        id: document.id,
        name: document.originalName,
        extension: document.extension,
        status: document.status,
        fileSize: document.fileSize,
        createdAt: document.createdAt,
      })),
    };
  });
};

const askTeacherAssistant = async (teacherId, message, courseId, documentId) => {
  if (documentId) return askDocumentAssistant(teacherId, documentId, message);
  const courses = await getTeacherContext(teacherId, courseId, documentId);
  let documentContext = "";

  if (documentId) {
    const courseIds = courses.map((course) => course.id);
    const document = await Document.findOne({
      where: {
        id: documentId,
        courseId: courseIds,
      },
    });

    if (!document) {
      const error = new Error("Document introuvable ou accès refusé");
      error.statusCode = 404;
      throw error;
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(document.filePath), {
      filename: document.originalName,
      contentType: document.mimeType,
    });

    const analysisResponse = await fetch(`${AI_SERVICE_URL}/api/ai/documents/analyze`, {
      method: "POST",
      headers: form.getHeaders(),
      body: form,
    });
    const analysis = await analysisResponse.json().catch(() => ({}));

    if (!analysisResponse.ok || typeof analysis.text !== "string") {
      const error = new Error(analysis.detail || "Impossible de lire le document sélectionné");
      error.statusCode = 502;
      throw error;
    }

    documentContext = analysis.text;
  }

  const response = await fetch(`${AI_SERVICE_URL}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      role: "TEACHER",
      context: { courses, document: documentContext },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || data.message || "Le service IA est indisponible");
    error.statusCode = response.status >= 500 ? 503 : response.status;
    if (response.status === 429) {
      error.statusCode = 429;
      error.retryAfter = response.headers.get("retry-after");
    }
    throw error;
  }

  return { response: data.data?.response || data.response, courses };
};

const buildAdminAssistantContext = ({
  user,
  users = [],
  usersByRole = {},
  courses = [],
  exams = [],
  pendingRequests = [],
  recentAudit = [],
} = {}) => {
  const normalizedUsers = Array.isArray(users) ? users : [];
  const normalizedCourses = Array.isArray(courses) ? courses : [];
  const normalizedExams = Array.isArray(exams) ? exams : [];
  const normalizedRequests = Array.isArray(pendingRequests) ? pendingRequests : [];
  const normalizedAudit = Array.isArray(recentAudit) ? recentAudit : [];

  const recentUsers = normalizedUsers
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      role: item.role,
      isActive: item.isActive,
      createdAt: item.createdAt,
    }));

  const recentCourses = normalizedCourses
    .slice(0, 10)
    .map((course) => ({
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
      teacher: course.teacher ? `${course.teacher.firstName || ""} ${course.teacher.lastName || ""}`.trim() : null,
      studentsCount: course.studentsCount ?? 0,
      createdAt: course.createdAt,
    }));

  const recentExams = normalizedExams
    .slice(0, 10)
    .map((exam) => ({
      id: exam.id,
      title: exam.title,
      status: exam.status,
      course: exam.course ? { id: exam.course.id, name: exam.course.name } : null,
      createdAt: exam.createdAt,
    }));

  return {
    utilisateur: {
      id: user?.id ?? null,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
      email: user?.email ?? null,
      role: user?.role ?? "ADMIN",
    },
    statistiques: {
      utilisateurs: normalizedUsers.length,
      etudiants: Number(usersByRole.STUDENT || 0),
      enseignants: Number(usersByRole.TEACHER || 0),
      administrateurs: Number(usersByRole.ADMIN || 0),
      utilisateursActifs: normalizedUsers.filter((item) => item.isActive).length,
      cours: normalizedCourses.length,
      examens: normalizedExams.length,
      examensPublies: normalizedExams.filter((item) => item.status === "PUBLISHED").length,
      demandesEnAttente: normalizedRequests.length,
    },
    utilisateursRecents: recentUsers,
    cours: recentCourses,
    examens: recentExams,
    demandesEnAttente: normalizedRequests.map((request) => ({
      id: request.id,
      email: request.email,
      requestedRole: request.requestedRole,
      firstName: request.firstName,
      lastName: request.lastName,
      createdAt: request.createdAt,
      status: request.status,
    })),
    auditsRecents: normalizedAudit.map((entry) => ({
      id: entry.id,
      action: entry.action,
      description: entry.description,
      userId: entry.userId,
      targetUserId: entry.targetUserId,
      status: entry.status,
      createdAt: entry.createdAt,
    })),
  };
};

const getAssistantContext = async (user) => {
  const userRecord = await User.findByPk(user.id, {
    attributes: ["id", "firstName", "lastName", "email", "role", "program", "level", "university"],
  });
  const context = {
    utilisateur: userRecord?.toJSON() || { id: user.id, role: user.role },
  };

  if (user.role === "ADMIN") {
    const [users, students, teachers, admins, activeUsers, courses, exams, publishedExams, pendingRequests, recentAudit] = await Promise.all([
      User.findAll({
        attributes: ["id", "firstName", "lastName", "email", "role", "isActive", "createdAt"],
        order: [["createdAt", "DESC"]],
      }),
      User.count({ where: { role: "STUDENT" } }),
      User.count({ where: { role: "TEACHER" } }),
      User.count({ where: { role: "ADMIN" } }),
      User.count({ where: { isActive: true } }),
      Course.findAll({
        attributes: ["id", "name", "code", "description", "teacherId", "createdAt"],
        include: [{ model: User, as: "teacher", attributes: ["id", "firstName", "lastName"] }],
        order: [["createdAt", "DESC"]],
      }),
      Exam.findAll({
        attributes: ["id", "title", "status", "createdAt", "courseId"],
        include: [{ model: Course, as: "course", attributes: ["id", "name", "code"] }],
        order: [["createdAt", "DESC"]],
      }),
      Exam.count({ where: { status: "PUBLISHED" } }),
      UserRequest.findAll({
        where: { status: "PENDING" },
        attributes: ["id", "userId", "firstName", "lastName", "email", "requestedRole", "status", "createdAt"],
        order: [["createdAt", "DESC"]],
      }),
      Audit.findAll({
        attributes: ["id", "userId", "action", "description", "targetUserId", "status", "createdAt"],
        order: [["createdAt", "DESC"]],
        limit: 10,
      }),
    ]);

    const courseList = await Promise.all(
      courses.map(async (course) => {
        const studentsCount = await CourseStudent.count({ where: { courseId: course.id } });
        return {
          ...course.toJSON(),
          studentsCount,
        };
      })
    );

    const adminContext = buildAdminAssistantContext({
      user: userRecord?.toJSON() || { id: user.id, role: user.role },
      users: users.map((item) => item.toJSON()),
      usersByRole: { STUDENT: students, TEACHER: teachers, ADMIN: admins },
      courses: courseList,
      exams: exams.map((item) => item.toJSON()),
      pendingRequests: pendingRequests.map((item) => item.toJSON()),
      recentAudit: recentAudit.map((item) => item.toJSON()),
    });

    Object.assign(context, adminContext);
    context.statistiques = {
      ...context.statistiques,
      utilisateursActifs: activeUsers,
      cours: courseList.length,
      examens: exams.length,
      examensPublies: publishedExams,
      demandesEnAttente: pendingRequests.length,
    };
    return context;
  }

  if (user.role === "TEACHER") {
    const courses = await Course.findAll({
      where: { teacherId: user.id },
      attributes: ["id", "name", "code", "description"],
      include: [
        {
          model: User,
          as: "students",
          attributes: ["id", "firstName", "lastName"],
          through: { attributes: [] },
        },
        {
          model: Document,
          as: "documents",
          attributes: ["id", "originalName", "status", "createdAt"],
        },
        {
          model: Exam,
          as: "exams",
          attributes: ["id", "title", "status", "startDate", "endDate"],
          include: [{
            model: ExamResult,
            as: "results",
            attributes: ["studentId", "score", "totalPoints", "percentage", "status"],
            include: [{ model: User, as: "student", attributes: ["id", "firstName", "lastName"] }],
          }],
        },
      ],
    });
    context.cours = courses.map((course) => {
      const value = course.toJSON();
      return {
        id: value.id,
        name: value.name,
        code: value.code,
        description: value.description,
        nombreEtudiants: (value.students || []).length,
        etudiants: (value.students || []).map(({ id, firstName, lastName }) => ({ id, nom: `${firstName} ${lastName}` })),
        documents: (value.documents || []).map(({ id, originalName, status, createdAt }) => ({ id, nom: originalName, status, createdAt })),
        examens: (value.exams || []).map((exam) => ({
          id: exam.id,
          titre: exam.title,
          status: exam.status,
          resultats: (exam.results || []).map((result) => ({
            etudiantId: result.studentId,
            etudiant: result.student ? `${result.student.firstName} ${result.student.lastName}` : null,
            score: result.score,
            totalPoints: result.totalPoints,
            pourcentage: result.percentage,
            status: result.status,
          })),
        })),
      };
    });
    context.statistiques = {
      cours: courses.length,
      examensPublies: courses.reduce((total, course) => total + (course.exams || []).filter((exam) => exam.status === "PUBLISHED").length, 0),
      etudiantsTotal: new Set(courses.flatMap((course) => (course.students || []).map((student) => student.id))).size,
    };
    return context;
  }

  const enrollments = await CourseStudent.findAll({ where: { studentId: user.id }, attributes: ["courseId"] });
  const courseIds = enrollments.map((enrollment) => enrollment.courseId);
  const courses = courseIds.length
    ? await Course.findAll({
      where: { id: courseIds },
      attributes: ["id", "name", "code", "description"],
      include: [{ model: Document, as: "documents", attributes: ["id", "originalName", "status", "createdAt"] }],
    })
    : [];
  const publishedExams = courseIds.length
    ? await Exam.findAll({ where: { courseId: courseIds, status: "PUBLISHED" }, attributes: ["id", "courseId", "title", "startDate", "endDate", "duration"] })
    : [];
  const results = courseIds.length
    ? await ExamResult.findAll({
      where: { studentId: user.id },
      attributes: ["examId", "score", "totalPoints", "percentage", "status", "submittedAt"],
      include: [{ model: Exam, as: "exam", where: { courseId: courseIds }, attributes: ["id", "courseId", "title"] }],
    })
    : [];
  context.cours = courses.map((course) => course.toJSON());
  context.examensPublies = publishedExams.map((exam) => exam.toJSON());
  context.mesResultats = results.map((result) => result.toJSON());
  context.statistiques = { cours: courses.length, examensPublies: publishedExams.length, resultats: results.length };
  return context;
};

const askAssistant = async (user, message, options = {}) => {
  if (user.role === "STUDENT") {
    if (options.courseId) {
      return askStudentCourseAssistant(user.id, options.courseId, message);
    }
    return askStudentAssistant(user.id, message, options);
  }
  const context = await getAssistantContext(user);
  context.routing = { source: "DATABASE", evidence: "sequelize" };
  const response = await fetch(`${AI_SERVICE_URL}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    timeout: 90000,
    body: JSON.stringify({ message, role: user.role, context }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || data.message || "Le service IA est indisponible");
    error.statusCode = response.status >= 500 ? 503 : response.status;
    throw error;
  }
  return { response: data.data?.response || data.response };
};

const askAdminReportAssistant = async (report) => {
  const response = await fetch(`${AI_SERVICE_URL}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    timeout: 90000,
    body: JSON.stringify({
      role: "ADMIN",
      message: [
        "Rédige un résumé exécutif court pour le rapport de pilotage EduAI.",
        "Base-toi exclusivement sur les chiffres fournis.",
        "Présente 2 à 4 phrases : situation globale, point fort, risque principal et priorité d'action.",
        "N'invente aucune tendance ni donnée absente. Réponds en français, sans titre ni liste.",
      ].join(" "),
      context: {
        routing: { source: "ADMIN_REPORT_DATABASE", evidence: "sequelize" },
        rapport: report.summary,
        insights: report.insights,
      },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || data.message || "Le service IA est indisponible");
    error.statusCode = response.status >= 500 ? 503 : response.status;
    throw error;
  }
  return data.data?.response || data.response;
};

module.exports = {
  askTeacherAssistant,
  askDocumentAssistant,
  askStudentCourseAssistant,
  indexDocument,
  askAssistant,
  askAdminReportAssistant,
  buildAdminAssistantContext,
};