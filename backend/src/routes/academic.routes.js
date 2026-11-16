const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const controller = require("../controllers/academic.controller");

const router = express.Router();

router.use(authenticate);
router.get("/options", controller.getOptions);
router.get("/teacher/classes", authorize("TEACHER"), controller.getTeacherClasses);

router.use("/admin", authorize("ADMIN"));
router.get("/admin", controller.getAdminStructure);

router.post("/admin/years", controller.createYear);
router.patch("/admin/years/:id/activate", controller.activateYear);
router.delete("/admin/years/:id", controller.deleteYear);

router.post("/admin/programs", controller.createProgram);
router.patch("/admin/programs/:id", controller.setProgramActive);
router.delete("/admin/programs/:id", controller.deleteProgram);

router.post("/admin/levels", controller.createLevel);
router.patch("/admin/levels/:id", controller.setLevelActive);
router.delete("/admin/levels/:id", controller.deleteLevel);

router.post("/admin/classes", controller.createClass);
router.put("/admin/classes/:id/teachers", controller.assignTeachers);
router.delete("/admin/classes/:id", controller.deleteClass);

module.exports = router;
