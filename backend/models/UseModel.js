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
    filePath: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      field: "file_path",
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "owner_id",
    },
    rawText: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      field: "raw_text",
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
    tableName: "use_models",
    timestamps: true,
    underscored: true,
  }
);

module.exports = UseModel;
