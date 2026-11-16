const sequelize = require("./src/config/database");
const { User } = require("./src/models");

(async () => {
  try {
    // Get a test user (teacher or student)
    const users = await User.findAll({
      limit: 5,
    });

    console.log("=== USERS IN DATABASE ===\n");
    users.forEach((user) => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log("---");
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})();
