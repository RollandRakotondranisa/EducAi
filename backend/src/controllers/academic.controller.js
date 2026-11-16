const academicService = require("../services/academic.service");

const handler = (action) => async (req, res, next) => {
  try {
    const data = await action(req);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOptions: handler(() => academicService.getStudentOptions()),
  getTeacherClasses: handler((req) => academicService.getClassesForTeacher(req.user.id)),
  getAdminStructure: handler(() => academicService.getAdminStructure()),
  createYear: handler((req) => academicService.createYear(req.body)),
  activateYear: handler((req) => academicService.activateYear(req.params.id)),
  deleteYear: handler((req) => academicService.deleteYear(req.params.id)),
  createProgram: handler((req) => academicService.createProgram(req.body)),
  setProgramActive: handler((req) => academicService.setProgramActive(req.params.id, req.body.isActive)),
  deleteProgram: handler((req) => academicService.deleteProgram(req.params.id)),
  createLevel: handler((req) => academicService.createLevel(req.body)),
  setLevelActive: handler((req) => academicService.setLevelActive(req.params.id, req.body.isActive)),
  deleteLevel: handler((req) => academicService.deleteLevel(req.params.id)),
  createClass: handler((req) => academicService.createClass(req.body)),
  assignTeachers: handler((req) => academicService.assignTeachers(req.params.id, req.body.teacherIds)),
  deleteClass: handler((req) => academicService.deleteClass(req.params.id)),
};
