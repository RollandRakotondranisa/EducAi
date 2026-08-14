const sequelize = require("./src/config/database");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("DB OK: connexion réussie");
    process.exit(0);
  } catch (err) {
    console.error("DB ERROR:", err.message || err);
    console.error(err);
    process.exit(1);
  }
})();
