const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const GroupMember = sequelize.define(
  "GroupMember",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    assignment_group_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "assignment_group_id",
      comment: "Reference to assignment_groups (NULL if exam group)",
    },
    exam_group_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "exam_group_id",
      comment: "Reference to exam_groups (NULL if assignment group)",
    },
    student_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "student_id",
      comment: "Student member of the group",
    },
    role: {
      type: DataTypes.ENUM("OWNER", "MEMBER"),
      allowNull: false,
      defaultValue: "MEMBER",
      comment: "Role in group: OWNER or MEMBER",
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "joined_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "group_members",
    timestamps: false,
    underscored: true,
  }
);

module.exports = GroupMember;

// Associations
const AssignmentGroup = require("./AssignmentGroup");
const ExamGroup = require("./ExamGroup");
const User = require("./User");

GroupMember.belongsTo(AssignmentGroup, {
  foreignKey: "assignment_group_id",
  as: "assignmentGroup",
  onDelete: "CASCADE",
});

GroupMember.belongsTo(ExamGroup, {
  foreignKey: "exam_group_id",
  as: "examGroup",
  onDelete: "CASCADE",
});

GroupMember.belongsTo(User, {
  foreignKey: "student_id",
  as: "student",
  onDelete: "CASCADE",
});
