const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Lecture = sequelize.define(
  "Lecture",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    attachment: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    publish_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "archived"),
      allowNull: false,
      defaultValue: "draft",
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
    tableName: "lectures",
    timestamps: true,
    underscored: true,
  }
);

// Associations
const Course = require("./Course");
const User = require("./User");

Lecture.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});
// Lecture no longer directly belongsTo Class; class is determined via ClassCourse linking
Lecture.belongsTo(User, {
  foreignKey: "teacher_id",
  as: "teacher",
});

module.exports = Lecture;
