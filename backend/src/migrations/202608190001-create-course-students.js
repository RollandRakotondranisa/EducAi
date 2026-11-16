"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("course_students", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "courses",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: "users",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Empêcher le même étudiant
    // d'être ajouté deux fois au même cours
    await queryInterface.addConstraint(
      "course_students",
      {
        fields: ["courseId", "studentId"],
        type: "unique",
        name: "unique_course_student",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("course_students");
  },
};