const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ClassCourse = sequelize.define(
  "ClassCourse",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "class_courses",
    timestamps: false,
  }
);

// Associations
const Class = require("./Class");
const Course = require("./Course");

// Sử dụng model ClassCourse làm through để Sequelize tạo bảng đúng chuẩn (có cột id)
Class.belongsToMany(Course, {
  through: ClassCourse,
  foreignKey: "class_id",
  otherKey: "course_id",
  as: "courses",
});
Course.belongsToMany(Class, {
  through: ClassCourse,
  foreignKey: "course_id",
  otherKey: "class_id",
  as: "classes",
});

// Một class_courses thuộc về một class và một course
ClassCourse.belongsTo(Class, {
  foreignKey: "class_id",
  as: "class",
});
ClassCourse.belongsTo(Course, {
  foreignKey: "course_id",
  as: "course",
});

module.exports = ClassCourse;
