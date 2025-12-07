const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ConstraintAnswer = sequelize.define(
  "ConstraintAnswer",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    question_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "question_id",
    },
    contributor_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "contributor_id",
    },
    ocl_text: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
      field: "ocl_text",
    },
    comment_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "comment_text",
    },
    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"),
      allowNull: false,
      defaultValue: "PENDING",
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
    tableName: "constraint_answers",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ConstraintAnswer;
