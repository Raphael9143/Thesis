const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UseGeneralization = sequelize.define(
  "UseGeneralization",
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
    specific_use_class_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "specific_use_class_id",
    },
    general_use_class_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "general_use_class_id",
    },
    specific_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    general_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "use_generalizations",
    timestamps: false,
    underscored: true,
  }
);

module.exports = UseGeneralization;
