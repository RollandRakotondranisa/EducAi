const assert = require("node:assert/strict");
const test = require("node:test");

const {
  classifyQuestion,
  isAccessibleCourse,
  requestedStudentId,
} = require("./src/services/student-ai.service");
const { buildAdminAssistantContext } = require("./src/services/ai.service");
const { buildAdminReportSummary } = require("./src/services/auth.service");

test("classe une question sur les cours comme DATABASE", () => {
  assert.equal(classifyQuestion("Quels sont mes cours ?"), "DATABASE");
});

test("classe une question documentaire comme DOCUMENT", () => {
  assert.equal(classifyQuestion("Explique-moi le chapitre sur les fonctions Python"), "DOCUMENT");
});

test("classe une question note plus révision comme DATABASE_AND_RAG", () => {
  assert.equal(
    classifyQuestion("J'ai eu 11/20 en Python, explique les notions que je dois réviser selon mon cours"),
    "DATABASE_AND_RAG",
  );
});

test("refuse le ciblage arbitraire dans le contrat d'entrée", () => {
  assert.equal(requestedStudentId("Donne-moi la moyenne de l'étudiant 20"), 20);
});

test("autorise uniquement un cours inscrit", () => {
  assert.equal(isAccessibleCourse([3, 13], 13), true);
  assert.equal(isAccessibleCourse([3, 13], 20), false);
});

test("construit un contexte admin riche avec utilisateurs, cours, examens et audit", () => {
  const context = buildAdminAssistantContext({
    user: { id: 1, firstName: "Admin", lastName: "Test", email: "admin@eduai.test", role: "ADMIN" },
    users: [
      { id: 1, firstName: "Admin", lastName: "Test", email: "admin@eduai.test", role: "ADMIN", isActive: true },
      { id: 2, firstName: "Alice", lastName: "Student", email: "alice@eduai.test", role: "STUDENT", isActive: true },
      { id: 3, firstName: "Bob", lastName: "Teacher", email: "bob@eduai.test", role: "TEACHER", isActive: false },
    ],
    usersByRole: { STUDENT: 1, TEACHER: 1, ADMIN: 1 },
    courses: [
      { id: 10, name: "Maths", code: "MATH101", description: "Algèbre", teacher: { firstName: "Bob", lastName: "Teacher" }, studentsCount: 2 },
    ],
    exams: [
      { id: 21, title: "Quiz 1", status: "PUBLISHED", course: { id: 10, name: "Maths" } },
      { id: 22, title: "Quiz 2", status: "DRAFT", course: { id: 10, name: "Maths" } },
    ],
    pendingRequests: [{ id: 5, requestedRole: "STUDENT", email: "charlie@eduai.test", createdAt: "2026-09-01T10:00:00.000Z" }],
    recentAudit: [{ id: 8, action: "LOGIN", description: "Connexion admin", createdAt: "2026-09-22T09:00:00.000Z" }],
  });

  assert.equal(context.utilisateur.id, 1);
  assert.equal(context.statistiques.utilisateurs, 3);
  assert.equal(context.statistiques.etudiants, 1);
  assert.equal(context.statistiques.enseignants, 1);
  assert.ok(Array.isArray(context.utilisateursRecents));
  assert.ok(Array.isArray(context.cours));
  assert.equal(context.demandesEnAttente.length, 1);
  assert.equal(context.auditsRecents[0].action, "LOGIN");
});

test("génère un rapport admin complet avec synthèse et export", () => {
  const report = buildAdminReportSummary({
    totalUsers: 120,
    totalTeachers: 18,
    totalStudents: 96,
    totalAdmins: 6,
    totalCourses: 25,
    totalExams: 60,
    publishedExams: 42,
    activeUsers: 104,
    pendingRequests: 7,
    recentAudit: [
      { action: "LOGIN", description: "Connexion admin", createdAt: "2026-09-22T09:00:00.000Z" },
      { action: "UPDATE_USER", description: "Modification de profil", createdAt: "2026-09-22T08:00:00.000Z" },
    ],
  });

  assert.equal(report.summary.totalUsers, 120);
  assert.equal(report.summary.pendingRequests, 7);
  assert.ok(report.summary.healthScore >= 0 && report.summary.healthScore <= 100);
  assert.equal(report.recentAudit.length, 2);
  assert.ok(Array.isArray(report.kpis));
});