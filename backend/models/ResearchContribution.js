const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ResearchContribution = sequelize.define(
  "ResearchContribution",
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
    use_model_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "use_model_id",
      comment: "Reference to a UseModel copy containing the contribution (optional)",
    },
    contributor_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "contributor_id",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "NEEDS_EDIT", "ACCEPTED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    validation_report: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      field: "validation_report",
    },
    review_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "review_notes",
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
    tableName: "research_contributions",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ResearchContribution;
