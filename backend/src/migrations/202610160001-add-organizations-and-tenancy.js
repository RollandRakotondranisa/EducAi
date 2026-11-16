"use strict";

const scopedTables = [
  "users",
  "user_requests",
  "courses",
  "course_students",
  "audits",
  "documents",
  "document_history",
  "exams",
  "exam_questions",
  "exam_attempts",
  "exam_answers",
  "exam_results",
  "messages",
  "message_attachments",
  "announcements",
  "announcement_attachments",
  "academic_years",
  "academic_programs",
  "academic_levels",
  "academic_classes",
  "academic_class_teachers",
];

async function replaceUniqueIndex(queryInterface, table, columns) {
  const indexes = await queryInterface.showIndex(table);
  const oldIndexes = indexes.filter((index) =>
    index.unique && index.fields.map((field) => field.attribute || field.name).join(",") === columns[columns.length - 1]
  );
  for (const index of oldIndexes) {
    await queryInterface.removeIndex(table, index.name);
  }
  await queryInterface.addIndex(table, ["organizationId", ...columns], {
    unique: true,
    name: `uniq_${table}_organization_${columns.join("_")}`,
  });
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("organizations", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(180), allowNull: false },
      normalizedName: { type: Sequelize.STRING(180), allowNull: false, unique: true },
      isLegacy: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.addColumn("users", "isSuperAdmin", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("users", "superAdminKey", {
      type: Sequelize.STRING(32),
      allowNull: true,
    });
    await queryInterface.addIndex("users", ["superAdminKey"], {
      unique: true,
      name: "uniq_users_single_super_admin",
    });

    for (const table of scopedTables) {
      await queryInterface.addColumn(table, "organizationId", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    const now = new Date();
    await queryInterface.bulkInsert("organizations", [{
      name: "Espace historique",
      normalizedName: "espace historique",
      isLegacy: true,
      createdAt: now,
      updatedAt: now,
    }]);
    const [legacyOrganizations] = await queryInterface.sequelize.query(
      "SELECT id FROM organizations WHERE normalizedName = 'espace historique' LIMIT 1"
    );
    const legacyOrganizationId = legacyOrganizations[0].id;
    for (const table of scopedTables) {
      await queryInterface.bulkUpdate(table, { organizationId: legacyOrganizationId }, { organizationId: null });
    }

    await replaceUniqueIndex(queryInterface, "users", ["matricule"]);
    await replaceUniqueIndex(queryInterface, "courses", ["code"]);
    await replaceUniqueIndex(queryInterface, "documents", ["fileName"]);
    await replaceUniqueIndex(queryInterface, "academic_years", ["name"]);
    await replaceUniqueIndex(queryInterface, "academic_programs", ["name"]);
    await replaceUniqueIndex(queryInterface, "academic_levels", ["name"]);
  },

  async down(queryInterface) {
    for (const table of scopedTables.slice().reverse()) {
      await queryInterface.removeColumn(table, "organizationId");
    }
    await queryInterface.removeIndex("users", "uniq_users_single_super_admin");
    await queryInterface.removeColumn("users", "superAdminKey");
    await queryInterface.removeColumn("users", "isSuperAdmin");
    await queryInterface.dropTable("organizations");
  },
};
