const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

// Create a test token (manually sign since we don't have the secret easily)
// Let's just test by fetching through HTTP

const testDownload = async () => {

  try {
    require("dotenv").config();
    const sequelize = require("./src/config/database");
    const { User } = require("./src/models");

    // Get user info for token
    const student = await User.findByPk(1);
    if (!student) {
      console.error("User 1 not found");
      process.exit(1);
    }

    console.log("=== TESTING DOWNLOAD ===\n");
    console.log("Testing document ID 7...\n");
    console.log(`User: ${student.email} (${student.role})\n`);

    // Try without auth first to see what happens
    console.log("1. Testing WITHOUT authentication:");
    let response = await fetch(
      "http://localhost:5000/api/documents/7/download",
      {
        method: "GET",
        headers: {},
      }
    );
    console.log(`   Status: ${response.status}`);
    const text = await response.text();
    console.log(`   Response type: ${response.headers.get("content-type")}`);
    console.log(`   Response size: ${text.length} bytes`);
    console.log(
      `   First 100 chars: ${text.substring(0, 100)}`
    );

    if (response.status !== 200) {
      console.log(`   Full response: ${text}`);
    }

    console.log("\n---\n");

    // Try to login first
    console.log("2. Testing LOGIN:");
    const loginResponse = await fetch(
      "http://localhost:5000/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "tata@gmail.com",
          password: "12345", // default test password
        }),
      }
    );

    console.log(
      `   Login Status: ${loginResponse.status}`
    );
    const loginData = await loginResponse.json();
    console.log(`   Login Response:`, loginData);

    if (loginData.data?.token) {
      const token = loginData.data.token;
      console.log(`   Token: ${token.substring(0, 20)}...`);
  console.log("\n3. Testing WITH authentication (from login):");
      const authResponse = await fetch(
        "http://localhost:5000/api/documents/7/download",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`   Status: ${authResponse.status}`);
      console.log(
        `   Content-Type: ${authResponse.headers.get("content-type")}`
      );
      console.log(
        `   Content-Disposition: ${authResponse.headers.get("content-disposition")}`
      );
      console.log(
        `   Response size: ${authResponse.headers.get("content-length")} bytes`
      );

      // Check if it's really a PDF
      const buffer = await authResponse.buffer();
      console.log(
        `   Actual buffer size: ${buffer.length} bytes`
      );
      console.log(
        `   First 4 bytes (should be PDF signature '%PDF'): ${buffer.toString().substring(0, 20)}`
      );
      console.log(
        `   PDF Signature check: ${buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46 ? "✅ Valid PDF" : "❌ Not a PDF"}`
      );
    }

    // Also test with a manually created token (in case Session validation is the issue)
    console.log("\n---\n");
    console.log("2. Creating manual JWT token for User 1...");

    // Get or create a valid session
    const { Session } = require("./src/models");
    let session = await Session.findOne({
      where: { userId: 1, revokedAt: null },
    });

    if (!session) {
      session = await Session.create({
        userId: 1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    const manualToken = jwt.sign(
      {
        id: student.id,
        email: student.email,
        role: student.role,
        sessionId: session.id,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`   Token: ${manualToken.substring(0, 20)}...`);

    console.log("\n3. Testing WITH manual JWT token:");
    const manualAuthResponse = await fetch(
      "http://localhost:5000/api/documents/7/download",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${manualToken}`,
        },
      }
    );

    console.log(
      `   Status: ${manualAuthResponse.status}`
    );
    console.log(
      `   Content-Type: ${manualAuthResponse.headers.get("content-type")}`
    );
    console.log(
      `   Content-Disposition: ${manualAuthResponse.headers.get("content-disposition")}`
    );
    console.log(
      `   Response size: ${manualAuthResponse.headers.get("content-length")} bytes`
    );

    // Check if it's really a PDF
    const buffer = await manualAuthResponse.buffer();
    console.log(
      `   Actual buffer size: ${buffer.length} bytes`
    );
    console.log(
      `   First 4 bytes (should be PDF signature '%PDF'): ${buffer.toString("utf8", 0, 4)}`
    );
    console.log(
      `   PDF Signature check: ${buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46 ? "✅ Valid PDF" : "❌ Not a PDF"}`
    );

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

testDownload();
