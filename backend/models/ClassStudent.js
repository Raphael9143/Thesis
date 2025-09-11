const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');


const ClassStudent = sequelize.define('ClassStudent', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  classId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'class_id'
  },
  studentId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'student_id'
  },
  role: {
    type: DataTypes.ENUM('student', 'leader'),
    allowNull: true,
    defaultValue: 'student'
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'joined_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'class_students',
  timestamps: false
});

module.exports = ClassStudent;

// Associations (foreign key)
const Class = require('./Class');
const Student = require('./Student');

// Một bản ghi ClassStudent thuộc về một lớp
ClassStudent.belongsTo(Class, { foreignKey: 'class_id', onDelete: 'CASCADE' });
// Một bản ghi ClassStudent thuộc về một sinh viên
ClassStudent.belongsTo(Student, { foreignKey: 'student_id', as: 'student', onDelete: 'CASCADE' });
