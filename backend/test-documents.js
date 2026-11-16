const sequelize = require("./src/config/database");
const { Document } = require("./src/models");
const fs = require("fs");
const path = require("path");

(async () => {
  try {
    // Get all documents
    const documents = await Document.findAll({
      limit: 10,
    });

    console.log("=== DOCUMENTS IN DATABASE ===\n");

    for (const doc of documents) {
      console.log(`ID: ${doc.id}`);
      console.log(`Original Name: ${doc.originalName}`);
      console.log(`File Name: ${doc.fileName}`);
      console.log(`File Path: ${doc.filePath}`);
      console.log(`MIME Type: ${doc.mimeType}`);
      console.log(`Extension: ${doc.extension}`);
      console.log(`File Size: ${doc.fileSize}`);

      // Check if file exists
      if (fs.existsSync(doc.filePath)) {
        console.log(`✅ File exists at: ${doc.filePath}`);
        const stats = fs.statSync(doc.filePath);
        console.log(`   File size on disk: ${stats.size} bytes`);
      } else {
        console.log(`❌ File NOT found at: ${doc.filePath}`);
      }

      console.log("---\n");
    }

    // Check what's in the uploads folder
    console.log("\n=== FILES IN UPLOADS FOLDER ===\n");
    const uploadsPath = path.join(
      __dirname,
      "src/uploads/documents"
    );
    const files = fs.readdirSync(uploadsPath);
    files.forEach((file) => {
      const fullPath = path.join(uploadsPath, file);
      const stats = fs.statSync(fullPath);
      console.log(
        `${file} (${stats.size} bytes)`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})();
