const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ConstraintQuestion = sequelize.define(
  "ConstraintQuestion",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    research_project_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "research_project_id",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "question_text",
    },
    uml_use_file_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "uml_use_file_path",
      comment: "Path to a small .use file in uploads/constraints_contribute/",
    },
    status: {
      type: DataTypes.ENUM("OPEN", "CLOSED"),
      allowNull: false,
      defaultValue: "OPEN",
    },
    created_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "created_by",
      comment: "User who created the question (owner/moderator)",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_at",
    },
  },
  {
    tableName: "constraint_questions",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ConstraintQuestion;
