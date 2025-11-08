const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UseAttribute = sequelize.define(
  "UseAttribute",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    useClassId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "use_class_id",
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(200),
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
    tableName: "use_attributes",
    timestamps: true,
    underscored: true,
  }
);

module.exports = UseAttribute;
