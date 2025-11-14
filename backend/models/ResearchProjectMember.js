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
    research_project_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "research_project_id",
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "user_id",
    },
    role: {
      type: DataTypes.ENUM("OWNER", "MODERATOR", "CONTRIBUTOR"),
      allowNull: false,
      defaultValue: "CONTRIBUTOR",
    },
    joined_at: {
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
