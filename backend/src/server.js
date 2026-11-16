require("dotenv").config();

require("./models");
const app = require("./app");
const sequelize = require("./config/database");
const { processExpiredExams } = require("./services/examScheduler.service");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("MySQL connected successfully");

    app.listen(PORT, () => {
      console.log(`EduAI Backend running on port ${PORT}`);
    });
    processExpiredExams().catch((error) => console.error("Exam absence processing failed:", error));
    setInterval(() => {
      processExpiredExams().catch((error) => console.error("Exam absence processing failed:", error));
    }, 60 * 1000);
  } catch (error) {
    console.error("Unable to connect to database:", error);
    process.exit(1);
  }
};

startServer();
