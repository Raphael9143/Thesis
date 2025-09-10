const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');


const Class = sequelize.define('Class', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  teacherId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'teacher_id'
  },
  semester: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'in_progress', 'closed', 'archived', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'updated_at'
  }
}, {
  tableName: 'classes',
  timestamps: true,
  underscored: true
});

module.exports = Class;

// Associations (foreign key)
const ClassStudent = require('./ClassStudent');
const User = require('./User');

// Một lớp có nhiều học sinh (ClassStudent)
Class.hasMany(ClassStudent, { foreignKey: 'class_id', onDelete: 'CASCADE' });
// Một lớp thuộc về một giáo viên
Class.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher', onDelete: 'CASCADE' });
