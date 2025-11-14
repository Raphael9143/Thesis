const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Student = sequelize.define(
  "Student",
  {
    student_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    student_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    major: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    completed_assignments: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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
    tableName: "students",
    timestamps: true,
  }
);

// Associations
const ClassStudent = require("./ClassStudent");
Student.hasMany(ClassStudent, {
  foreignKey: "student_id",
  as: "classEnrollments",
  onDelete: "CASCADE",
});

module.exports = Student;

// Associations back to User (belongsTo) to allow eager-loading the user's profile from Student
// Require User after export to avoid circular require issues
const User = require("./User");
Student.belongsTo(User, {
  foreignKey: "student_id",
  as: "user",
});
