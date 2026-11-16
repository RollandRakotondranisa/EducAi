const test = require("node:test");
const assert = require("node:assert/strict");

const { getRecipientOptionsForRole } = require("./src/services/message.service");

test("for student, recipients include teachers, admins, and other students", () => {
  const recipients = getRecipientOptionsForRole("STUDENT", [
    { id: 1, firstName: "Admin", lastName: "System", role: "ADMIN" },
    { id: 2, firstName: "Prof", lastName: "Alpha", role: "TEACHER" },
    { id: 3, firstName: "Etudiant", lastName: "Bravo", role: "STUDENT" },
  ]);

  assert.equal(recipients.some((user) => user.role === "ADMIN"), true);
  assert.equal(recipients.some((user) => user.role === "TEACHER"), true);
  assert.equal(recipients.some((user) => user.role === "STUDENT"), true);
});

test("for teacher, recipients include students, admins, and teachers", () => {
  const recipients = getRecipientOptionsForRole("TEACHER", [
    { id: 1, firstName: "Admin", lastName: "System", role: "ADMIN" },
    { id: 2, firstName: "Prof", lastName: "Alpha", role: "TEACHER" },
    { id: 3, firstName: "Etudiant", lastName: "Bravo", role: "STUDENT" },
  ]);

  assert.equal(recipients.some((user) => user.role === "ADMIN"), true);
  assert.equal(recipients.some((user) => user.role === "STUDENT"), true);
  assert.equal(recipients.some((user) => user.role === "TEACHER"), true);
});
