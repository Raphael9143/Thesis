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
    assignment_group_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: "Reference to assignment group (NULL if individual)",
    },
    exam_group_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: "Reference to exam group (NULL if individual)",
    },
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
Submission.belongsTo(require("./AssignmentGroup"), {
  foreignKey: "assignment_group_id",
  as: "assignmentGroup",
});
Submission.belongsTo(require("./ExamGroup"), {
  foreignKey: "exam_group_id",
  as: "examGroup",
});

module.exports = Submission;
