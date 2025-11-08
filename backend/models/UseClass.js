const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UseClass = sequelize.define(
  "UseClass",
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
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
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
    tableName: "use_classes",
    timestamps: true,
    underscored: true,
  }
);

module.exports = UseClass;
