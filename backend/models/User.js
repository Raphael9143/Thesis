const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Định nghĩa User model

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],
        notEmpty: true,
      },
    },
    role: {
      type: DataTypes.ENUM("STUDENT", "TEACHER", "ADMIN", "RESEARCHER"),
      allowNull: false,
      defaultValue: "STUDENT",
    },
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"),
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "ACTIVE",
        "INACTIVE",
        "BANNED",
        "PENDING_VERIFICATION"
      ),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "users",
    timestamps: true, // Tự động tạo createdAt và updatedAt
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
    ],
  }
);

module.exports = User;

// Associations (foreign key)
const Class = require("./Class");
const ClassStudent = require("./ClassStudent");

// Một user có thể là giáo viên của nhiều lớp
User.hasMany(Class, {
  foreignKey: "teacher_id",
  as: "teachingClasses",
  onDelete: "CASCADE",
});
// Một user có thể là học sinh của nhiều lớp (qua ClassStudent)
User.hasMany(ClassStudent, {
  foreignKey: "student_id",
  as: "studentClasses",
  onDelete: "CASCADE",
});

// Một user có thể có một profile sinh viên (1-1)
const Student = require("./Student");
User.hasOne(Student, {
  foreignKey: "student_id",
  as: "studentProfile",
  onDelete: "CASCADE",
});

// Một user có thể có một profile researcher (1-1)
const Researcher = require("./Researcher");
User.hasOne(Researcher, {
  foreignKey: "researcher_id",
  as: "researcherProfile",
  onDelete: "CASCADE",
});
