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

  console.log("Testing /api/documents/7/download...\n");

  const response = await fetch(
    "http://localhost:5000/api/documents/7/download",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
  console.log(
    "Content-Length:",
    response.headers.get("content-length")
  );

  const text = await response.text();
  console.log("\nResponse (first 500 chars):");
  console.log(text.substring(0, 500));

  if (response.status === 404) {
    console.log("\n❌ ERROR: Got 404 when trying to download");
    console.log("This means res.download() is failing!");
  }

  process.exit(0);
})();
