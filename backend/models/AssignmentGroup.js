const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const AssignmentGroup = sequelize.define(
  "AssignmentGroup",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    assignment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "assignment_id",
      comment: "Reference to assignment with type=GROUP",
    },
    group_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "group_name",
      comment: "Name of the group",
    },
    owner_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "owner_id",
      comment: "Student who created the group",
    },
    research_project_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "research_project_id",
      comment: "Linked PRIVATE research project",
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "DISBANDED", "COMPLETED"),
      allowNull: false,
      defaultValue: "ACTIVE",
      comment: "Group status",
    },
    max_members: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      field: "max_members",
      comment: "Maximum number of members allowed",
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
    tableName: "assignment_groups",
    timestamps: true,
    underscored: true,
  }
);

module.exports = AssignmentGroup;

// Associations
const Assignment = require("./Assignment");
const User = require("./User");
const ResearchProject = require("./ResearchProject");

AssignmentGroup.belongsTo(Assignment, {
  foreignKey: "assignment_id",
  as: "assignment",
  onDelete: "CASCADE",
});

AssignmentGroup.belongsTo(User, {
  foreignKey: "owner_id",
  as: "owner",
});

AssignmentGroup.belongsTo(ResearchProject, {
  foreignKey: "research_project_id",
  as: "researchProject",
  onDelete: "CASCADE",
});
