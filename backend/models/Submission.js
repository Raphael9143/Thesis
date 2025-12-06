const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Submission = sequelize.define(
  "Submission",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    assignment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    exam_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    student_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: "Student who submitted (even in group work)",
    },
      // group-related fields removed (no group submissions)
    submission_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    attempt_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    attachment: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    auto_grader_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: "Score produced by the automatic grader (0-100)",
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "submissions",
    timestamps: false,
    underscored: true,
  }
);

Submission.belongsTo(require("./Assignment"), {
  foreignKey: "assignment_id",
  as: "assignment",
});
Submission.belongsTo(require("./Exam"), {
  foreignKey: "exam_id",
  as: "exam",
});
Submission.belongsTo(require("./Student"), {
  foreignKey: "student_id",
  as: "student",
});

module.exports = Submission;
