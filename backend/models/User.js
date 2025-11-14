const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Định nghĩa User model

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
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
    star_projects: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array of starred research_project ids",
      get() {
        const raw = this.getDataValue("star_projects");
        try {
          const arr = raw ? JSON.parse(raw) : [];
          return Array.isArray(arr) ? arr : [];
        } catch {
          return [];
        }
      },
      set(v) {
        try {
          const arr = Array.isArray(v) ? v : [];
          this.setDataValue("star_projects", JSON.stringify(arr));
        } catch {
          this.setDataValue("star_projects", JSON.stringify([]));
        }
      },
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
    tableName: "users",
    timestamps: true, // Tự động tạo created_at và updated_at
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
