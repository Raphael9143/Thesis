const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Teacher = sequelize.define(
  "Teacher",
  {
    teacher_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    teacher_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    department: {
      type: DataTypes.STRING(100),
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
    tableName: "teachers",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Teacher;

// Associations
const Class = require("./Class");
const User = require("./User");

// Một teacher có thể dạy nhiều lớp
Teacher.hasMany(Class, {
  foreignKey: "teacher_id",
  as: "classes",
  onDelete: "CASCADE",
});
// Một lớp thuộc về một teacher
Class.belongsTo(Teacher, {
  foreignKey: "teacher_id",
  as: "teacherProfile",
  onDelete: "CASCADE",
});

Teacher.belongsTo(User, {
  foreignKey: "teacher_id",
  as: "user",
});
