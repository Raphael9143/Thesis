const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ResearchProject = sequelize.define(
  "ResearchProject",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("DRAFT", "ACTIVE", "CLOSED"),
      allowNull: false,
      defaultValue: "DRAFT",
    },
    owner_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "owner_id",
      comment: "User id of project owner",
    },
    main_use_model_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "main_use_model_id",
      comment: "Reference to primary UseModel for this project",
    },
    star_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "star_count",
      comment: "Number of users who starred this project",
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
    tableName: "research_projects",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ResearchProject;
