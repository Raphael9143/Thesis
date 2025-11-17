const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Researcher = sequelize.define(
  "Researcher",
  {
    researcher_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    field_of_study: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Profile description",
    },
    reference_links: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of HTTPS reference links",
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
    tableName: "researchers",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Researcher;

// Associations
const User = require("./User");
Researcher.belongsTo(User, {
  foreignKey: "researcher_id",
  as: "user",
});
