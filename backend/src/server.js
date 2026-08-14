require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();

    console.log("MySQL connected successfully");

    app.listen(PORT, () => {
      console.log(`EduAI Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to database:", error);
    process.exit(1);
  }
};

startServer();