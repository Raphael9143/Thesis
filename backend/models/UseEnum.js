const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UseEnum = sequelize.define(
  "UseEnum",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    use_model_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "use_model_id",
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    values: {
      type: DataTypes.TEXT,
      allowNull: true,
    }, // comma-separated values
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
    tableName: "use_enums",
    timestamps: true,
    underscored: true,
  }
);

module.exports = UseEnum;
