const fs = require("fs/promises");
const path = require("path");

const {
  Document,
  DocumentHistory,
  Course,
  CourseStudent,
  User,
} = require("../models");
const { indexDocument } = require("./ai.service");


// =====================================================
// VERIFIER L'ACCES AU COURS
// =====================================================

const verifyCourseAccess = async (
  courseId,
  user
) => {

  // Enseignant propriétaire
  if (user.role === "TEACHER") {

    const course = await Course.findOne({
      where: {
        id: courseId,
        teacherId: user.id,
      },
    });

    if (!course) {
      const error = new Error(
        "Cours introuvable ou accès refusé"
      );

      error.statusCode = 404;

      throw error;
    }

    return course;
  }


  // Administrateur
  if (user.role === "ADMIN") {

    const course = await Course.findByPk(
      courseId
    );

    if (!course) {
      const error = new Error(
        "Cours introuvable"
      );

      error.statusCode = 404;

      throw error;
    }

    return course;
  }


  // Etudiant
  if (user.role === "STUDENT") {

    const student = await User.findByPk(user.id, {
      attributes: ["id", "program", "level"],
    });

    const enrollment =
      await CourseStudent.findOne({
        where: {
          courseId,
          studentId: user.id,
        },
      });

    const course = await Course.findByPk(courseId);
    const isTargeted = course
      && student
      && course.targetProgram === student.program
      && course.targetLevel === student.level;

    if (!enrollment && !isTargeted) {
      const error = new Error(
        "Vous n'êtes pas inscrit à ce cours"
      );

      error.statusCode = 403;

      throw error;
    }

    return course;
  }


  const error = new Error(
    "Accès refusé"
  );

  error.statusCode = 403;

  throw error;
};


// =====================================================
// UPLOAD
// =====================================================

const uploadDocument = async (
  courseId,
  user,
  file
) => {

  if (!file) {
    const error = new Error(
      "Aucun fichier envoyé"
    );

    error.statusCode = 400;

    throw error;
  }


  // Seuls professeur et admin peuvent uploader
  if (
    user.role !== "TEACHER" &&
    user.role !== "ADMIN"
  ) {
    await fs.unlink(file.path).catch(() => {});

    const error = new Error(
      "Vous n'avez pas le droit d'ajouter un document"
    );

    error.statusCode = 403;

    throw error;
  }


  await verifyCourseAccess(
    courseId,
    user
  );


  const extension =
    path.extname(file.originalname)
      .toLowerCase();


  const document =
    await Document.create({
      courseId,

      uploadedBy: user.id,

      originalName:
        file.originalname,

      fileName:
        file.filename,

      filePath:
        file.path,

      mimeType:
        file.mimetype,

      extension,

      fileSize:
        file.size,

      status: "UPLOADED",
    });


  await DocumentHistory.create({
    documentId: document.id,

    userId: user.id,

    action: "UPLOAD",

    details:
      `Document ${file.originalname} ajouté`,
  });

  void indexDocument(document.id, user.id).catch((error) => {
    console.error(`Indexation IA échouée pour le document ${document.id}:`, error.message);
  });


  return document;
};

const reindexDocument = async (documentId, user) => {
  if (user.role !== "TEACHER") {
    const error = new Error("Seul le professeur propriétaire peut relancer l'indexation");
    error.statusCode = 403;
    throw error;
  }
  await getDocument(documentId, user);
  return indexDocument(documentId, user.id);
};


// =====================================================
// LISTE
// =====================================================

const getDocuments = async (
  courseId,
  user
) => {

  await verifyCourseAccess(
    courseId,
    user
  );


  return Document.findAll({
    where: {
      courseId,
    },

    order: [
      ["createdAt", "DESC"],
    ],
  });
};


// =====================================================
// DOCUMENT
// =====================================================

const getDocument = async (
  documentId,
  user
) => {

  const document =
    await Document.findByPk(
      documentId
    );


  if (!document) {
    const error = new Error(
      "Document introuvable"
    );

    error.statusCode = 404;

    throw error;
  }


  await verifyCourseAccess(
    document.courseId,
    user
  );


  await DocumentHistory.create({
    documentId: document.id,

    userId: user.id,

    action: "VIEW",

    details: "Document consulté",
  });


  return document;
};


// =====================================================
// APERCU
// =====================================================

const previewDocument = async (
  documentId,
  user
) => {
  const document = await Document.findByPk(documentId);

  if (!document) {
    const error = new Error("Document introuvable");
    error.statusCode = 404;
    throw error;
  }

  await verifyCourseAccess(document.courseId, user);

  const previewable = document.mimeType === "application/pdf"
    || document.mimeType.startsWith("image/")
    || document.mimeType.startsWith("text/");

  if (!previewable) {
    const error = new Error("L'aperçu de ce format n'est pas disponible. Vous pouvez télécharger le document.");
    error.statusCode = 415;
    throw error;
  }

  await fs.access(document.filePath).catch(() => {
    const error = new Error("Fichier du document introuvable");
    error.statusCode = 404;
    throw error;
  });

  await DocumentHistory.create({
    documentId: document.id,
    userId: user.id,
    action: "VIEW",
    details: "Document prévisualisé",
  });

  return document;
};


// =====================================================
// TELECHARGEMENT
// =====================================================

const downloadDocument = async (
  documentId,
  user
) => {

  const document =
    await Document.findByPk(
      documentId
    );


  if (!document) {
    const error = new Error(
      "Document introuvable"
    );

    error.statusCode = 404;

    throw error;
  }


  await verifyCourseAccess(
    document.courseId,
    user
  );


  await DocumentHistory.create({
    documentId: document.id,

    userId: user.id,

    action: "DOWNLOAD",

    details: "Document téléchargé",
  });


  return document;
};


// =====================================================
// SUPPRESSION
// =====================================================

const deleteDocument = async (
  documentId,
  user
) => {

  const document =
    await Document.findByPk(
      documentId
    );


  if (!document) {
    const error = new Error(
      "Document introuvable"
    );

    error.statusCode = 404;

    throw error;
  }


  // Seuls professeur propriétaire et admin
  // peuvent supprimer
  if (
    user.role !== "TEACHER" &&
    user.role !== "ADMIN"
  ) {
    const error = new Error(
      "Vous n'avez pas le droit de supprimer ce document"
    );

    error.statusCode = 403;

    throw error;
  }


  await verifyCourseAccess(
    document.courseId,
    user
  );


  await DocumentHistory.create({
    documentId: document.id,

    userId: user.id,

    action: "DELETE",

    details: `Document ${document.originalName} supprimé`,
  });


  await fs
    .unlink(document.filePath)
    .catch(() => {});


  await document.destroy();

  return true;
};


// =====================================================
// HISTORIQUE
// =====================================================

const getHistory = async (
  documentId,
  user
) => {

  const document =
    await Document.findByPk(
      documentId
    );


  if (!document) {
    const error = new Error(
      "Document introuvable"
    );

    error.statusCode = 404;

    throw error;
  }


  await verifyCourseAccess(
    document.courseId,
    user
  );


  return DocumentHistory.findAll({
    where: {
      documentId,
    },

    order: [
      ["createdAt", "DESC"],
    ],
  });
};


module.exports = {
  uploadDocument,
  getDocuments,
  getDocument,
  previewDocument,
  downloadDocument,
  deleteDocument,
  getHistory,
  reindexDocument,
};