const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UseConstraint = sequelize.define(
  "UseConstraint",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    useModelId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "use_model_id",
    },
    context: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    kind: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    expression: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_at",
    },
  },
  {
    tableName: "use_constraints",
    timestamps: true,
    underscored: true,
  }
);

module.exports = UseConstraint;
