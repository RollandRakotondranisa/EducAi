const test = require("node:test");
const assert = require("node:assert/strict");

const { TARGET_ROLES, validateAnnouncementInput } = require("./src/services/announcement.service");

test("announcements support student, teacher, and all targets", () => {
  assert.deepEqual(TARGET_ROLES, ["STUDENT", "TEACHER", "ALL"]);
  assert.deepEqual(
    validateAnnouncementInput({ title: "Rentrée", content: "Bienvenue", targetRole: "student" }),
    { safeTitle: "Rentrée", safeContent: "Bienvenue", safeTargetRole: "STUDENT" }
  );
});

test("announcement validation rejects an invalid target", () => {
  assert.throws(
    () => validateAnnouncementInput({ title: "Info", content: "Message", targetRole: "ADMIN" }),
    /cible de l'annonce est invalide/
  );
});
