const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UseAssociationPart = sequelize.define(
  "UseAssociationPart",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    use_association_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "use_association_id",
    },
    class_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "class_name",
    },
    multiplicity: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING(200),
      allowNull: true,
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
    tableName: "use_association_parts",
    timestamps: true,
    underscored: true,
  }
);

module.exports = UseAssociationPart;
