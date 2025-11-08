const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Teacher = sequelize.define(
  "Teacher",
  {
    teacher_id: {
      type: DataTypes.INTEGER,
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
    research_papers: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "teachers",
    timestamps: true,
  }
);

// Associations
const Class = require("./Class");
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

module.exports = Teacher;
