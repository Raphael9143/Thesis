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
// Require related models after export to avoid circular require problems
const Class = require('./Class');
const Student = require('./Student');
const User = require('./User');

// Một bản ghi ClassStudent thuộc về một lớp
ClassStudent.belongsTo(Class, { foreignKey: 'class_id', onDelete: 'CASCADE' });
// Một bản ghi ClassStudent thuộc về một sinh viên (profile)
ClassStudent.belongsTo(Student, { foreignKey: 'student_id', as: 'studentProfile', onDelete: 'CASCADE' });
// Và để thuận tiện khi cần thông tin user (email, role...), ánh xạ luôn tới User với alias 'student'
ClassStudent.belongsTo(User, { foreignKey: 'student_id', as: 'student', onDelete: 'CASCADE' });
