const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ResearchProjectMember = sequelize.define(
  "ResearchProjectMember",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    researchProjectId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "research_project_id",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    role: {
      type: DataTypes.ENUM("OWNER", "MODERATOR", "CONTRIBUTOR"),
      allowNull: false,
      defaultValue: "CONTRIBUTOR",
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "joined_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "research_project_members",
    timestamps: false,
    underscored: true,
  }
);

module.exports = ResearchProjectMember;
