const { Op } = require("sequelize");
const sequelize = require("../config/database");
const {
  AcademicYear,
  AcademicProgram,
  AcademicLevel,
  AcademicClass,
  AcademicClassTeacher,
  User,
  Course,
  Exam,
} = require("../models");

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const requiredName = (value, label, maxLength) => {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) fail(`${label} est obligatoire.`);
  if (name.length > maxLength) fail(`${label} ne peut pas dépasser ${maxLength} caractères.`);
  return name;
};

const getAdminStructure = async () => {
  const [years, programs, levels, classes, teachers] = await Promise.all([
    AcademicYear.findAll({ order: [["startsAt", "DESC"]] }),
    AcademicProgram.findAll({ order: [["name", "ASC"]] }),
    AcademicLevel.findAll({ order: [["position", "ASC"], ["name", "ASC"]] }),
    AcademicClass.findAll({
      include: [
        { model: AcademicYear, as: "academicYear" },
        { model: AcademicProgram, as: "program" },
        { model: AcademicLevel, as: "level" },
        { model: User, as: "teachers", attributes: ["id", "firstName", "lastName", "email"], through: { attributes: [] } },
      ],
      order: [["id", "DESC"]],
    }),
    User.findAll({ where: { role: "TEACHER", isActive: true }, attributes: ["id", "firstName", "lastName", "email"], order: [["lastName", "ASC"], ["firstName", "ASC"]] }),
  ]);
  return { years, programs, levels, classes, teachers };
};

const getStudentOptions = async () => {
  const activeYear = await AcademicYear.findOne({ where: { isActive: true } });
  if (!activeYear) return { academicYear: null, programs: [], levels: [], classes: [] };
  const [programs, levels, classes] = await Promise.all([
    AcademicProgram.findAll({ where: { isActive: true }, order: [["name", "ASC"]] }),
    AcademicLevel.findAll({ where: { isActive: true }, order: [["position", "ASC"], ["name", "ASC"]] }),
    AcademicClass.findAll({
      where: { academicYearId: activeYear.id },
      attributes: ["id", "name", "programId", "levelId"],
      order: [["name", "ASC"]],
    }),
  ]);
  return { academicYear: activeYear, programs, levels, classes };
};

const createYear = async (data) => {
  const name = requiredName(data.name, "Le nom de l'année universitaire", 20);
  const yearParts = name.match(/^(\d{4})-(\d{4})$/);
  if (!yearParts || Number(yearParts[2]) !== Number(yearParts[1]) + 1) fail("L'année universitaire doit être au format AAAA-AAAA et couvrir deux années consécutives.");
  const { startsAt, endsAt } = data;
  const isDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  if (!isDate(startsAt) || !isDate(endsAt) || startsAt >= endsAt) {
    fail("Les dates de début et de fin de l'année universitaire sont invalides.");
  }
  return AcademicYear.create({ name, startsAt, endsAt });
};

const activateYear = async (yearId) => {
  const year = await AcademicYear.findByPk(yearId);
  if (!year) fail("Année universitaire introuvable.", 404);
  return sequelize.transaction(async (transaction) => {
    await AcademicYear.update({ isActive: false }, { where: { id: { [Op.ne]: year.id } }, transaction });
    await year.update({ isActive: true }, { transaction });
    return year;
  });
};

const createProgram = async (data) => AcademicProgram.create({
  name: requiredName(data.name, "Le nom du parcours", 150),
});

const createLevel = async (data) => {
  const position = Number(data.position ?? 0);
  if (!Number.isInteger(position) || position < 0) fail("L'ordre du niveau doit être un entier positif ou nul.");
  return AcademicLevel.create({
    name: requiredName(data.name, "Le nom du niveau", 80),
    position,
  });
};

const setActive = async (Model, id, active, label) => {
  if (typeof active !== "boolean") fail("Le statut actif doit être un booléen.");
  const record = await Model.findByPk(id);
  if (!record) fail(`${label} introuvable.`, 404);
  await record.update({ isActive: active });
  return record;
};

const deleteUnreferenced = async (Model, id, label) => {
  const record = await Model.findByPk(id);
  if (!record) fail(`${label} introuvable.`, 404);
  const classCount = await AcademicClass.count({
    where: Model === AcademicYear ? { academicYearId: id } : Model === AcademicProgram ? { programId: id } : { levelId: id },
  });
  if (classCount) fail(`Impossible de supprimer ${label.toLowerCase()} : des classes y sont encore rattachées. Archivez-le ou supprimez d'abord ces classes.`, 409);
  await record.destroy();
};

const createClass = async (data) => {
  const name = requiredName(data.name, "Le nom du groupe ou de la classe", 100);
  const academicYear = await AcademicYear.findByPk(data.academicYearId);
  const program = await AcademicProgram.findByPk(data.programId);
  const level = await AcademicLevel.findByPk(data.levelId);
  if (!academicYear || !program || !level) fail("Choisissez une année, un parcours et un niveau existants.");
  if (!program.isActive || !level.isActive) fail("Le parcours et le niveau doivent être actifs pour créer une classe.");
  const teacherIds = [...new Set((Array.isArray(data.teacherIds) ? data.teacherIds : []).map(Number))];
  if (teacherIds.some((id) => !Number.isInteger(id) || id < 1)) fail("La liste des enseignants est invalide.");
  const teachers = await User.findAll({ where: { id: teacherIds, role: "TEACHER", isActive: true }, attributes: ["id"] });
  if (teachers.length !== teacherIds.length) fail("Un ou plusieurs enseignants sélectionnés sont introuvables ou inactifs.");

  const classDetails = {
    name,
    academicYearId: academicYear.id,
    programId: program.id,
    levelId: level.id,
  };
  const duplicate = await AcademicClass.findOne({ where: classDetails });
  if (duplicate) {
    fail("Cette classe existe déjà pour cette année universitaire, ce parcours et ce niveau.", 409);
  }

  try {
    return await sequelize.transaction(async (transaction) => {
      const academicClass = await AcademicClass.create(classDetails, { transaction });
      if (teacherIds.length) {
        await AcademicClassTeacher.bulkCreate(
          teacherIds.map((teacherId) => ({ academicClassId: academicClass.id, teacherId })),
          { transaction }
        );
      }
      return academicClass;
    });
  } catch (error) {
    if (
      error.name === "SequelizeUniqueConstraintError" ||
      error.original?.code === "ER_DUP_ENTRY" ||
      error.parent?.code === "ER_DUP_ENTRY"
    ) {
      fail("Cette classe existe déjà pour cette année universitaire, ce parcours et ce niveau.", 409);
    }
    throw error;
  }
};

const assignTeachers = async (classId, teacherIdsValue) => {
  const academicClass = await AcademicClass.findByPk(classId);
  if (!academicClass) fail("Classe introuvable.", 404);
  if (!Array.isArray(teacherIdsValue)) fail("La liste des enseignants est invalide.");
  const teacherIds = [...new Set(teacherIdsValue.map(Number))];
  if (teacherIds.some((id) => !Number.isInteger(id) || id < 1)) fail("La liste des enseignants est invalide.");
  const teachers = await User.findAll({ where: { id: teacherIds, role: "TEACHER", isActive: true }, attributes: ["id"] });
  if (teachers.length !== teacherIds.length) fail("Un ou plusieurs enseignants sélectionnés sont introuvables ou inactifs.");
  return sequelize.transaction(async (transaction) => {
    await AcademicClassTeacher.destroy({ where: { academicClassId: academicClass.id }, transaction });
    if (teacherIds.length) {
      await AcademicClassTeacher.bulkCreate(teacherIds.map((teacherId) => ({ academicClassId: academicClass.id, teacherId })), { transaction });
    }
    return academicClass.reload({
      include: [{ model: User, as: "teachers", attributes: ["id", "firstName", "lastName", "email"], through: { attributes: [] } }],
      transaction,
    });
  });
};

const deleteClass = async (classId) => {
  const academicClass = await AcademicClass.findByPk(classId);
  if (!academicClass) fail("Classe introuvable.", 404);
  if (await User.count({ where: { academicClassId: academicClass.id } })) {
    fail("Impossible de supprimer cette classe car des étudiants y sont inscrits.", 409);
  }
  const [courseCount, examCount] = await Promise.all([
    Course.count({ where: { targetAcademicClassId: academicClass.id } }),
    Exam.count({ where: { targetAcademicClassId: academicClass.id } }),
  ]);
  if (courseCount || examCount) {
    fail("Impossible de supprimer cette classe car des cours ou des examens y sont rattachés.", 409);
  }
  await academicClass.destroy();
};

const getAssignedClasses = async (teacherId) => AcademicClass.findAll({
  include: [
    { model: AcademicYear, as: "academicYear", where: { isActive: true }, attributes: ["id", "name"] },
    { model: AcademicProgram, as: "program", attributes: ["id", "name"] },
    { model: AcademicLevel, as: "level", attributes: ["id", "name"] },
    { model: User, as: "teachers", attributes: [], through: { attributes: [] }, where: { id: teacherId } },
  ],
  order: [[{ model: AcademicProgram, as: "program" }, "name", "ASC"], [{ model: AcademicLevel, as: "level" }, "position", "ASC"], ["name", "ASC"]],
});

const getAssignedActiveClass = async (academicClassId, teacherId) => {
  const classId = Number(academicClassId);
  if (!Number.isInteger(classId) || classId < 1) fail("La classe ciblée est invalide.");
  const academicClass = await AcademicClass.findOne({
    where: { id: classId },
    include: [
      { model: AcademicYear, as: "academicYear", where: { isActive: true } },
      { model: AcademicProgram, as: "program", where: { isActive: true } },
      { model: AcademicLevel, as: "level", where: { isActive: true } },
    ],
  });
  if (!academicClass) fail("La classe ciblée doit appartenir à l'année universitaire active.");
  if (!await AcademicClassTeacher.findOne({ where: { academicClassId: academicClass.id, teacherId } })) {
    fail("Vous ne pouvez cibler qu'une classe qui vous a été affectée par l'administrateur.", 403);
  }
  return academicClass;
};

const getClassesForTeacher = async (teacherId) => {
  const classes = await getAssignedClasses(teacherId);
  return classes.map((academicClass) => ({
    id: academicClass.id,
    name: academicClass.name,
    academicYearId: academicClass.academicYear.id,
    academicYear: academicClass.academicYear,
    programId: academicClass.program.id,
    program: academicClass.program,
    levelId: academicClass.level.id,
    level: academicClass.level,
  }));
};

const getStudentsForTeacher = async (teacherId) => {
  const classes = await getAssignedClasses(teacherId);
  const classIds = classes.map((academicClass) => academicClass.id);
  if (!classIds.length) return [];
  return User.findAll({
    where: { role: "STUDENT", academicClassId: classIds },
    attributes: ["id", "firstName", "lastName", "email", "isActive", "avatar", "matricule", "level", "program", "phone", "studentProfileCompleted", "academicClassId", "createdAt", "updatedAt"],
    order: [["lastName", "ASC"], ["firstName", "ASC"]],
  }).then((students) => students.map((student) => student.toJSON()));
};

module.exports = {
  getAdminStructure,
  getStudentOptions,
  createYear,
  activateYear,
  deleteYear: (id) => deleteUnreferenced(AcademicYear, id, "Année universitaire"),
  createProgram,
  setProgramActive: (id, active) => setActive(AcademicProgram, id, active, "Parcours"),
  deleteProgram: (id) => deleteUnreferenced(AcademicProgram, id, "Parcours"),
  createLevel,
  setLevelActive: (id, active) => setActive(AcademicLevel, id, active, "Niveau"),
  deleteLevel: (id) => deleteUnreferenced(AcademicLevel, id, "Niveau"),
  createClass,
  assignTeachers,
  deleteClass,
  getAssignedActiveClass,
  getClassesForTeacher,
  getAssignedClasses,
  getStudentsForTeacher,
};
