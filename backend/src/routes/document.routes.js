const express = require("express");

const authenticate = require(
  "../middleware/auth.middleware"
);

const upload = require(
  "../middleware/upload.middleware"
);

const documentController = require(
  "../controllers/document.controller"
);

const router = express.Router();


router.use(authenticate);


// =====================================================
// UPLOAD
// =====================================================

router.post(
  "/courses/:courseId/documents",
  upload.single("file"),
  documentController.upload
);


// =====================================================
// LISTE DES DOCUMENTS
// =====================================================

router.get(
  "/courses/:courseId/documents",
  documentController.getDocuments
);


// =====================================================
// VISUALISER
// =====================================================

router.get(
  "/:documentId",
  documentController.getDocument
);


// =====================================================
// APERCU
// =====================================================

router.get(
  "/:documentId/preview",
  documentController.preview
);


// =====================================================
// TELECHARGER
// =====================================================

router.get(
  "/:documentId/download",
  documentController.download
);


// =====================================================
// SUPPRIMER
// =====================================================

router.delete(
  "/:documentId",
  documentController.remove
);


// =====================================================
// HISTORIQUE
// =====================================================

router.get(
  "/:documentId/history",
  documentController.getHistory
);

router.post(
  "/:documentId/reindex",
  documentController.reindex
);


module.exports = router;