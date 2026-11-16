"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("academic_years", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      startsAt: { type: Sequelize.DATEONLY, allowNull: false },
      endsAt: { type: Sequelize.DATEONLY, allowNull: false },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.createTable("academic_programs", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.createTable("academic_levels", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(80), allowNull: false, unique: true },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.createTable("academic_classes", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      academicYearId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "academic_years", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      programId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "academic_programs", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      levelId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "academic_levels", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });
    await queryInterface.addIndex("academic_classes", ["academicYearId", "programId", "levelId", "name"], { unique: true });

    await queryInterface.createTable("academic_class_teachers", {
      academicClassId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: "academic_classes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      teacherId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
    });

    await queryInterface.addColumn("users", "academicClassId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "academic_classes", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "academicClassId");
    await queryInterface.dropTable("academic_class_teachers");
    await queryInterface.dropTable("academic_classes");
    await queryInterface.dropTable("academic_levels");
    await queryInterface.dropTable("academic_programs");
    await queryInterface.dropTable("academic_years");
  },
};
