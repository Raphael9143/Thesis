const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Researcher = sequelize.define(
  "Researcher",
  {
    researcher_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    researcher_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    field_of_study: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    research_interests: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of research interest topics",
    },
    publications: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of publication titles",
    },
    current_projects: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of current research projects",
    },
    academic_rank: {
      type: DataTypes.ENUM(
        "RESEARCH_ASSISTANT",
        "RESEARCHER",
        "SENIOR_RESEARCHER",
        "PRINCIPAL_RESEARCHER"
      ),
      allowNull: true,
      defaultValue: "RESEARCHER",
    },
    years_of_experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    tableName: "researchers",
    timestamps: true,
  }
);

module.exports = Researcher;
