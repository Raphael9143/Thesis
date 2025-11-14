const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UseModel = sequelize.define(
  "UseModel",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    file_path: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      field: "file_path",
    },
    owner_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "owner_id",
    },
    raw_text: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      field: "raw_text",
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
    tableName: "use_models",
    timestamps: true,
    underscored: true,
  }
);

module.exports = UseModel;
