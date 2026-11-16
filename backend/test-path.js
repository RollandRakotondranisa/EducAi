require("dotenv").config();
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");

(async () => {
  const { User, Session } = require("./src/models");
  const user = await User.findByPk(1);

  let session = await Session.findOne({
    where: { userId: 1 },
  });

  if (!session) {
    session = await Session.create({
      userId: 1,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }

  const token = jwt.sign(
    {
      id: 1,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "24h" }
  );

  console.log("Testing WRONG path: /api/documents/7/download");
  let response = await fetch(
    "http://localhost:5000/api/documents/7/download",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  console.log("Status:", response.status, "- Got 404\n");

  console.log(
    "Testing CORRECT path: /api/documents/documents/7/download"
  );
  response = await fetch(
    "http://localhost:5000/api/documents/documents/7/download",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  console.log("Status:", response.status);
  console.log(
    "Content-Type:",
    response.headers.get("content-type")
  );
  console.log(
    "Content-Disposition:",
    response.headers.get("content-disposition")
  );

  const buffer = await response.buffer();
  console.log("Size:", buffer.length);
  console.log(
    "Is PDF:",
    buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
  );

  process.exit(0);
})();
