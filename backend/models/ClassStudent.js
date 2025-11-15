const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const ClassStudent = sequelize.define(
  "ClassStudent",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    class_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "class_id",
    },
    student_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "student_id",
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "joined_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "class_students",
    timestamps: false,
    underscored: true,
  }
);
module.exports = ClassStudent;

// Associations (foreign key)
// Require related models after export to avoid circular require problems
const Class = require("./Class");
const Student = require("./Student");
const User = require("./User");

ClassStudent.belongsTo(Class, {
  foreignKey: "class_id",
  onDelete: "CASCADE",
});

ClassStudent.belongsTo(Student, {
  foreignKey: "student_id",
  as: "studentProfile",
  onDelete: "CASCADE",
});

ClassStudent.belongsTo(User, {
  foreignKey: "student_id",
  as: "student",
  onDelete: "CASCADE",
});
