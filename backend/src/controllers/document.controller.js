const documentService = require(
  "../services/document.service"
);


// =====================================================
// UPLOAD
// =====================================================

const upload = async (req, res, next) => {

  try {

    const document =
      await documentService.uploadDocument(
        req.params.courseId,
        req.user,
        req.file
      );

    return res.status(201).json({
      success: true,
      message: "Document uploadé avec succès",
      data: document,
    });

  } catch (error) {

    next(error);

  }
};


// =====================================================
// LISTE
// =====================================================

const getDocuments = async (
  req,
  res,
  next
) => {

  try {

    const documents =
      await documentService.getDocuments(
        req.params.courseId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message: "Documents récupérés",
      data: documents,
    });

  } catch (error) {

    next(error);

  }
};


// =====================================================
// VISUALISER
// =====================================================

const getDocument = async (
  req,
  res,
  next
) => {

  try {

    const document =
      await documentService.getDocument(
        req.params.documentId,
        req.user
      );

    return res.status(200).json({
      success: true,
      data: document,
    });

  } catch (error) {

    next(error);

  }
};


// =====================================================
// APERCU
// =====================================================

const preview = async (
  req,
  res,
  next
) => {
  try {
    const document = await documentService.previewDocument(
      req.params.documentId,
      req.user
    );

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(document.originalName)}"`);
    return res.sendFile(document.filePath);
  } catch (error) {
    next(error);
  }
};


// =====================================================
// DOWNLOAD
// =====================================================

const download = async (
  req,
  res,
  next
) => {

  try {

    const document =
      await documentService.downloadDocument(
        req.params.documentId,
        req.user
      );


    return res.download(
      document.filePath,
      document.originalName
    );

  } catch (error) {

    next(error);

  }
};


// =====================================================
// DELETE
// =====================================================

const remove = async (
  req,
  res,
  next
) => {

  try {

    await documentService.deleteDocument(
      req.params.documentId,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: "Document supprimé avec succès",
    });

  } catch (error) {

    next(error);

  }
};


// =====================================================
// HISTORIQUE
// =====================================================

const getHistory = async (
  req,
  res,
  next
) => {

  try {

    const history =
      await documentService.getHistory(
        req.params.documentId,
        req.user
      );

    return res.status(200).json({
      success: true,
      message: "Historique récupéré",
      data: history,
    });

  } catch (error) {

    next(error);

  }
};


const reindex = async (req, res, next) => {
  try {
    const result = await documentService.reindexDocument(req.params.documentId, req.user);
    return res.status(200).json({ success: true, message: "Document réindexé", data: result });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  upload,
  getDocuments,
  getDocument,
  preview,
  download,
  remove,
  getHistory,
  reindex,
};