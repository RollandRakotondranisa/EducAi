const examService = require("../services/exam.service");
const examAttemptService = require("../services/examAttempt.service");
const PDFDocument = require("pdfkit");
const XLSX = require("xlsx");

const getExportRows = ({ exam, results }) => {
  const subject = exam.course?.name || exam.course?.code || exam.title;
  return results.map((result) => ({
    Matière: subject,
    Matricule: result.student?.matricule || "",
    Nom: result.student?.lastName || "",
    Prénom: result.student?.firstName || "",
    Note: result.status === "ABSENT"
      ? `Absent (0/${result.totalPoints})`
      : `${result.score}/${result.totalPoints}`,
    Statut: result.status === "ABSENT" ? "Absent" : "Présent",
  }));
};

// =====================================================
// CREATE
// =====================================================

const createExam = async (req, res, next) => {
  try {
    const exam = await examService.createExam({
      ...req.body,
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Examen créé avec succès",
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// UPDATE
// =====================================================

const updateExam = async (req, res, next) => {
  try {
    const exam = await examService.updateExam({
      examId: req.params.id,
      userId: req.user.id,
      ...req.body,
    });

    res.json({
      success: true,
      message: "Examen modifié avec succès",
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET ONE
// =====================================================

const getExam = async (req, res, next) => {
  try {
    const exam = await examService.getExamById(req.params.id, req.user);

    res.json({
      success: true,
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// GET COURSE EXAMS
// =====================================================

const getCourseExams = async (req, res, next) => {
  try {
    const exams =
      await examService.getCourseExams(
        req.params.courseId,
        req.user
      );

    res.json({
      success: true,
      data: exams,
    });
  } catch (error) {
    next(error);
  }
};

const getMyExams = async (req, res, next) => {
  try {
    const exams = await examService.getExamsForUser(req.user);
    res.json({ success: true, data: exams });
  } catch (error) {
    next(error);
  }
};

const getExamResults = async (req, res, next) => {
  try {
    const data = await examAttemptService.getExamResults({ examId: req.params.id, teacherId: req.user.id });
    res.json({ success: true, data: data.results, exam: data.exam });
  } catch (error) { next(error); }
};

const getExamCopies = async (req, res, next) => {
  try {
    const data = await examAttemptService.getExamCopies({
      examId: req.params.id,
      teacherId: req.user.id,
    });
    res.json({ success: true, data: data.attempts, exam: data.exam });
  } catch (error) { next(error); }
};

const getExamCopy = async (req, res, next) => {
  try {
    const data = await examAttemptService.getCopyForCorrection({
      examId: req.params.id,
      attemptId: req.params.attemptId,
      teacherId: req.user.id,
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const suggestExamCopyGrades = async (req, res, next) => {
  try {
    const data = await examAttemptService.suggestExamCopyGrades({
      examId: req.params.id,
      attemptId: req.params.attemptId,
      teacherId: req.user.id,
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

const gradeExamCopy = async (req, res, next) => {
  try {
    const data = await examAttemptService.gradeExamCopy({
      examId: req.params.id,
      attemptId: req.params.attemptId,
      teacherId: req.user.id,
      grades: req.body.grades,
    });
    res.json({ success: true, message: "Correction enregistrée", data });
  } catch (error) { next(error); }
};

const exportExamResults = async (req, res, next) => {
  try {
    const format = req.params.format;
    if (!["pdf", "xlsx"].includes(format)) {
      return res.status(400).json({ success: false, message: "Format d'export non pris en charge." });
    }

    const data = await examAttemptService.getExamResults({ examId: req.params.id, teacherId: req.user.id });
    const rows = getExportRows(data);
    const filename = `resultats-examen-${data.exam.id}`;

    if (format === "xlsx") {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows, {
        header: ["Matière", "Matricule", "Nom", "Prénom", "Note", "Statut"],
      });
      worksheet["!cols"] = [
        { wch: 28 },
        { wch: 20 },
        { wch: 24 },
        { wch: 24 },
        { wch: 22 },
        { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, "Résultats");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.set({
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      });
      return res.send(buffer);
    }

    const document = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("error", next);
    document.on("end", () => {
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      });
      res.send(Buffer.concat(chunks));
    });

    document.fontSize(18).text("Résultats de l'examen", { align: "center" });
    document.moveDown(0.4);
    document.fontSize(12).text(data.exam.title, { align: "center" });
    document.fontSize(10).text(`Matière : ${data.exam.course?.name || data.exam.course?.code || "Non renseignée"}`, { align: "center" });
    document.moveDown();

    const columns = [
      { title: "Matière", width: 140, value: (row) => row.Matière },
      { title: "Matricule", width: 110, value: (row) => row.Matricule },
      { title: "Nom", width: 130, value: (row) => row.Nom },
      { title: "Prénom", width: 130, value: (row) => row.Prénom },
      { title: "Note", width: 100, value: (row) => row.Note },
      { title: "Statut", width: 75, value: (row) => row.Statut },
    ];
    const rowHeight = 24;
    const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const startX = (document.page.width - tableWidth) / 2;
    let y = document.y;

    const drawRow = (values, header = false) => {
      if (y + rowHeight > document.page.height - document.page.margins.bottom) {
        document.addPage({ size: "A4", layout: "landscape", margin: 36 });
        y = document.page.margins.top;
        if (!header) drawRow(columns.map((column) => column.title), true);
      }
      let x = startX;
      columns.forEach((column, index) => {
        document.rect(x, y, column.width, rowHeight)
          .fillAndStroke(header ? "#e8f1f7" : "#ffffff", "#cbd5e1");
        document.fillColor("#0a1628").font(header ? "Helvetica-Bold" : "Helvetica").fontSize(9)
          .text(String(values[index] ?? ""), x + 5, y + 7, {
            width: column.width - 10,
            height: rowHeight - 10,
            ellipsis: true,
            lineBreak: false,
          });
        x += column.width;
      });
      y += rowHeight;
    };

    drawRow(columns.map((column) => column.title), true);
    rows.forEach((row) => drawRow(columns.map((column) => column.value(row))));
    document.end();
  } catch (error) {
    next(error);
  }
};

// =====================================================
// PUBLISH
// =====================================================

const publishExam = async (req, res, next) => {
  try {
    const exam =
      await examService.publishExam({
        examId: req.params.id,
        userId: req.user.id,
      });

    res.json({
      success: true,
      message: "Examen publié avec succès",
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// DELETE
// =====================================================

const deleteExam = async (req, res, next) => {
  try {
    await examService.deleteExam({
      examId: req.params.id,
      userId: req.user.id,
    });

    res.json({
      success: true,
      message: "Examen supprimé avec succès",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExam,
  updateExam,
  getExam,
  getCourseExams,
  getMyExams,
  getExamResults,
  getExamCopies,
  getExamCopy,
  suggestExamCopyGrades,
  gradeExamCopy,
  exportExamResults,
  publishExam,
  deleteExam,
};
