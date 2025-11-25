const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Exam = sequelize.define(
  "Exam",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    attachment: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Optional teacher-provided answer: stored file path (uploads) and reference to UseModel
    answer_attachment: {
      type: DataTypes.STRING(1024),
      allowNull: true,
    },
    answer_use_model_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    type: {
      type: DataTypes.ENUM("SINGLE", "GROUP"),
      allowNull: false,
      defaultValue: "SINGLE",
    },
    submission_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    tableName: "exams",
    timestamps: true,
    underscored: true,
  }
);

const Course = require("./Course");
const UseModel = require("./UseModel");
Exam.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

// link to persisted teacher answer use model (optional)
Exam.belongsTo(UseModel, {
  foreignKey: "answer_use_model_id",
  as: "answerUseModel",
});

module.exports = Exam;
