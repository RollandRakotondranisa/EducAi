const test = require("node:test");
const assert = require("node:assert/strict");

const { ROLE_RECIPIENTS, getRecipientOptionsForRole } = require("./src/services/message.service");

test("ROLE_RECIPIENTS allows student to contact teachers, admin, and students", () => {
  assert.deepEqual(ROLE_RECIPIENTS.STUDENT, ["TEACHER", "ADMIN", "STUDENT"]);
});

test("getRecipientOptionsForRole filters users by allowed role only", () => {
  const recipients = getRecipientOptionsForRole("STUDENT", [
    { id: 1, role: "TEACHER", firstName: "Alice", lastName: "Smith" },
    { id: 2, role: "STUDENT", firstName: "Bob", lastName: "Jones" },
    { id: 3, role: "ADMIN", firstName: "Carol", lastName: "Brown" },
  ]);

  assert.equal(recipients.length, 3);
  assert.deepEqual(recipients.map((recipient) => recipient.id), [1, 2, 3]);
});